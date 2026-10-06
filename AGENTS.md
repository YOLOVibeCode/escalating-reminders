# AGENTS.md

Read this before touching code. It is written for an agent running unattended
(Cursor Cloud Agent, `@CloudAgents` in Slack, Claude Code). `.cursorrules` is
for interactive chat; where it disagrees with this file, this file wins.

## What this project is

Escalating Reminders: reminders that raise urgency through tiers (one channel →
several → trusted contacts) until acknowledged, and stop when completion is
detected. Users are individuals managing tasks; "working" means a reminder
created in the web app is delivered by the worker at each tier on schedule, and
acknowledging it stops the escalation. Full product spec: `SPECIFICATION.md`.

## Noctusoft platforms

This product does not sign up for OpenAI, Twilio, SendGrid, or Square. The
product key is the only difference from any other Noctusoft app.

- **LLM** — LLM Relay at `https://ai.noctusoft.com/v1`, virtual key. No provider SDK.
- **Mail / text** — noctusoft-relay (`api.sendgrid.noctusoft.com`, `api.twilio.noctusoft.com`)
  with `NOCTUSOFT_API_KEY` and `X-App-Env`. SMS goes through
  `apps/api/src/domains/sms/guarded-sms-send.service.ts`, which enforces consent.
- **Billing** — the Noctusoft store, via `@noctusoft/store-client`
  (`packages/store-client`). Signed store events land in
  `apps/api/src/webhooks/store-webhook.controller.ts`. No Square SDK.

## Layout

npm workspaces + Turborepo.

- `apps/api/` — NestJS API (port 3801). Domains in `src/domains/<name>/`, tests in
  `__tests__/` next to them or `*.spec.ts` beside the file. Queue workers and the
  scheduler are separate entry points in `src/workers/`.
- `apps/api/prisma/schema.prisma` — the source of truth for the data model.
  Migrations in `apps/api/prisma/migrations/`.
- `apps/web/` — Next.js app (port 3800). Playwright E2E in `apps/web/e2e/`.
- `packages/@er/*` — shared types, interfaces, constants, utils, API client, UI components.
- `packages/store-client/` — Noctusoft store client (local `file:` dependency).
- `infrastructure/` — docker compose for Postgres and Redis, Dockerfiles.

## Commands

Run from the repo root unless the Notes say otherwise. The package manager is
**npm**, not pnpm, whatever `.cursorrules` says.

| Purpose | Command | Notes |
| --- | --- | --- |
| Install | `npm ci` | Keep the lockfile stable. |
| Prisma client | `cd apps/api && npm run prisma:generate` | Required before the API typechecks. No database needed. |
| API unit tests | `cd apps/api && npx jest` | ~3 s, no database or Redis. This is the gate. |
| Web unit tests | `cd apps/web && npx jest` | No services needed. |
| API typecheck | `cd apps/api && npx tsc --noEmit` | After `prisma:generate`. |
| Web typecheck | `cd apps/web && npm run typecheck` | |
| Lint | `npm run lint` | |
| Everything | `npm test`, `npm run typecheck` | Turborepo, all workspaces. |
| E2E | `cd apps/web && npm run e2e:critical` | Needs Postgres, Redis, both apps running. Not available on a fresh VM; skip and say so. |

Fresh-clone subset that must pass before you report done: `npm ci`, Prisma
generate, API jest, web jest, both typechecks.

## Health and version

`GET /health` on the API (outside the `/v1` prefix, no auth) returns the fleet
contract that `npm run version-board` in cloud-agents reads:

```json
{ "ok": true, "service": "escalating-reminders-api", "commit": "<full sha>", "env": "production", "utc": "…" }
```

`commit` comes from `RAILWAY_GIT_COMMIT_SHA` (Railway injects it) or
`BUILD_COMMIT_SHA`. `env` comes from `APP_ENV` (`dev` | `uat` | `production`),
never `NODE_ENV`. Keep `/health` liveness-only; dependency checks belong on a
separate route.

## Environments

Three, on Railway, each deployed from its own branch. Changes only move forward
by pull request: `feature → develop → uat → main`.

| Environment | Branch | `APP_ENV` | Store | SMS through the relay (mail once it moves there) |
| --- | --- | --- | --- | --- |
| dev | `develop` | `dev` | `STORE_MODE=test` | captured (`X-App-Env: dev`), never delivered |
| uat | `uat` | `uat` | `STORE_MODE=test` | tagged (`X-App-Env: uat`) |
| production | `main` | `production` | `STORE_MODE=live`, set by hand | delivered |

- **Agents branch from `develop` and open PRs into `develop`.** Promotion PRs are
  `develop → uat` and `uat → main`; the `promotion-source` check fails any other
  source. Rulesets for all three branches are in `ops/github/rulesets/`.
- Infrastructure is code: `.railway/railway.ts` (api, worker, scheduler, web,
  Postgres, Redis per environment). Secrets are `preserve()`d there and set by
  `ops/railway/bootstrap-env.sh` under `op run`; never write a value into the repo.
- Images: `infrastructure/Dockerfile.api` (api, worker, scheduler) and
  `infrastructure/Dockerfile.web`. Both build from a clean checkout; the api runs
  `prisma migrate deploy` as its pre-deploy step.
- `APP_ENV` drives `/health`, the dev/uat banner, and `X-App-Env`. Unset means `dev`.

## Conventions

- TypeScript strict. No `any` without a comment saying why.
- Throw errors; do not return null for failures. No `console.log` in `src/`; use the logger.
- New UI elements get stable `data-testid` selectors (see `.cursorrules`, "automation-friendly").
- Conventional Commits, one concern per commit.

## Never

- Edit an existing migration. Add a new one.
- Touch `railway*.toml`, `infrastructure/`, Dockerfiles, or CI config unless the task says so.
- Push to `develop`, `uat`, `main`, or `master`. Branch from `develop`; open a PR into `develop`. The shell hook enforces this.
- Add a provider SDK (OpenAI, Twilio, SendGrid, Square). Use the Noctusoft platforms above.
- Commit secrets or `.env` files, or print any part of a key.
- Switch the Cursor model to Fast, Opus, or GPT. Composer 2.5, Fast off. Resume a `bc-` id; do not start a second job. Never buy extra Max usage.

## Definition of done

1. The fresh-clone subset above passes; paste the output.
2. New behavior has a test.
3. User-facing changes are reflected in `README.md` or `docs/`.
4. `git status` is clean; the work is on a branch with a PR into `develop`.
5. Last lines of the job are COST on each AI's own meter. If usage is missing:
   `COST this run: unknown`.
