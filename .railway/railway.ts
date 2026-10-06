/**
 * Escalating Reminders — Railway infrastructure as code.
 *
 * One project, three environments, each deployed from its own branch:
 *   dev        → develop
 *   uat        → uat
 *   production → main
 * Changes move develop → uat → main by pull request (promotion-source check).
 *
 * Services per environment, all built from this repo:
 *   api        NestJS API; runs `prisma migrate deploy` before each deploy
 *   worker     BullMQ consumer (same image as api)
 *   scheduler  due-reminder and escalation poll; exactly one replica
 *   web        Next.js
 *   Postgres, Redis
 *
 * Secrets are preserve(): Railway holds the values, ops/railway/bootstrap-env.sh
 * sets them, and none are written here.
 *
 *   railway link --environment <env>
 *   railway config plan     # always review (needs node >= 22.6 on PATH)
 *   railway config apply    # only after approval
 */
import { defineRailway, github, postgres, preserve, project, redis, service } from "railway/iac";

const REGION = "us-east4-eqdc4a";

export default defineRailway((ctx) => {
  const isProd = ctx.isEnvironment("production");
  const isUat = ctx.isEnvironment("uat");

  const appEnv = isProd ? "production" : isUat ? "uat" : "dev";
  const branch = isProd ? "main" : isUat ? "uat" : "develop";
  const repo = github("YOLOVibeCode/escalating-reminders", { branch, checkSuites: true });

  const Postgres = postgres("Postgres", { region: REGION });
  // Known quirk (2026-10-06): applying this to a second environment created Redis from the
  // Bitnami template (railwayapp/redis, volume at /bitnami, no start command, no variables).
  // uat was aligned with dev by hand: image redis:8.2, dev's start command, REDIS_PASSWORD plus
  // the REDIS_* templates. bootstrap-env.sh fails if DATABASE_URL or REDIS_URL is empty.
  const Redis = redis("Redis", { region: REGION });

  const apiBuild = {
    builder: "DOCKERFILE" as const,
    dockerfilePath: "infrastructure/Dockerfile.api",
  };

  // Shared by api, worker, and scheduler.
  const backendEnv = {
    APP_ENV: appEnv,
    NODE_ENV: "production",
    DATABASE_URL: Postgres.env.DATABASE_URL,
    REDIS_URL: Redis.env.REDIS_URL,
    // Test data endpoints only where nobody real signs in.
    ENABLE_SEEDING: isProd ? "false" : isUat ? "false" : "true",

    JWT_SECRET: preserve(),
    JWT_REFRESH_SECRET: preserve(),
    CORS_ORIGIN: preserve(),
    GOOGLE_CLIENT_ID: preserve(),
    GOOGLE_CLIENT_SECRET: preserve(),
    // Noctusoft relay. SMS sends X-App-Env = APP_ENV (dev captured, uat tagged).
    NOCTUSOFT_API_KEY: preserve(),
    RELAY_INBOUND_SECRET: preserve(),
    SMS_INBOUND_WEBHOOK_URL: preserve(),
    SMS_STATUS_WEBHOOK_URL: preserve(),
    // Noctusoft store.
    RELAY_WEBHOOK_SECRET: preserve(),
    STORE_WEBHOOK_URL: preserve(),
    // dev and uat are always test; production must be set to live explicitly.
    STORE_MODE: isProd ? preserve() : "test",
    // Email still speaks SMTP until it moves to the relay (STATUS.md gap 2).
    SMTP_HOST: preserve(),
    SMTP_PORT: preserve(),
    SMTP_FROM: preserve(),
  };

  const api = service("api", {
    source: repo,
    build: apiBuild,
    preDeployCommand: ["npx prisma migrate deploy --schema=./prisma/schema.prisma"],
    healthcheck: "/health",
    healthcheckTimeout: 60,
    replicas: { [REGION]: 1 },
    env: backendEnv,
  });

  const worker = service("worker", {
    source: repo,
    build: apiBuild,
    startCommand: "node dist/apps/api/src/workers/worker.js",
    replicas: { [REGION]: 1 },
    env: backendEnv,
  });

  // Never more than one: two schedulers would queue every due reminder twice.
  const scheduler = service("scheduler", {
    source: repo,
    build: apiBuild,
    startCommand: "node dist/apps/api/src/workers/scheduler.js",
    replicas: { [REGION]: 1 },
    env: backendEnv,
  });

  const web = service("web", {
    source: repo,
    build: {
      builder: "DOCKERFILE",
      dockerfilePath: "infrastructure/Dockerfile.web",
    },
    replicas: { [REGION]: 1 },
    env: {
      // Both are read at build time (see Dockerfile.web).
      APP_ENV: appEnv,
      NEXT_PUBLIC_API_URL: preserve(),
    },
  });

  // Custom domains are added with `railway domain <host> --service <svc>` once DNS
  // exists, then declared here. Until then each service uses its Railway domain.

  return project("escalating-reminders", {
    resources: [api, worker, scheduler, web, Postgres, Redis],
  });
});
