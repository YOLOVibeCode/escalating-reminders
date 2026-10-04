import { Controller, Get } from '@nestjs/common';

export interface HealthBody {
  ok: true;
  service: 'escalating-reminders-api';
  commit: string;
  env: string;
  utc: string;
}

/**
 * Liveness plus "which build is this", in the fleet contract `npm run version-board` reads.
 * `commit` comes from the host (Railway injects RAILWAY_GIT_COMMIT_SHA); `env` from APP_ENV, never NODE_ENV.
 */
export function healthBody(env: NodeJS.ProcessEnv = process.env, now: Date = new Date()): HealthBody {
  return {
    ok: true,
    service: 'escalating-reminders-api',
    commit: env.RAILWAY_GIT_COMMIT_SHA?.trim() || env.BUILD_COMMIT_SHA?.trim() || 'unknown',
    env: env.APP_ENV?.trim() || 'dev',
    utc: now.toISOString(),
  };
}

@Controller('health')
export class HealthController {
  @Get()
  health(): HealthBody {
    return healthBody();
  }
}
