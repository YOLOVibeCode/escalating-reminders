import { healthBody } from '../health.controller';

describe('GET /health body', () => {
  const now = new Date('2026-10-04T12:00:00.000Z');

  it('reports the Railway commit and the deploy env', () => {
    const body = healthBody({ RAILWAY_GIT_COMMIT_SHA: 'abc123', APP_ENV: 'production', NODE_ENV: 'production' }, now);
    expect(body).toEqual({
      ok: true,
      service: 'escalating-reminders-api',
      commit: 'abc123',
      env: 'production',
      utc: '2026-10-04T12:00:00.000Z',
    });
  });

  it('falls back to BUILD_COMMIT_SHA when the host injects nothing', () => {
    expect(healthBody({ BUILD_COMMIT_SHA: 'def456' }, now).commit).toBe('def456');
  });

  it('says unknown and dev rather than guessing', () => {
    const body = healthBody({ NODE_ENV: 'production' }, now);
    expect(body.commit).toBe('unknown');
    expect(body.env).toBe('dev');
  });
});
