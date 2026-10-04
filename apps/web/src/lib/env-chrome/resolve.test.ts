import { normalizeEnv, resolveServerEnv } from './resolve';

describe('normalizeEnv', () => {
  it('normalizes the canonical values', () => {
    expect(normalizeEnv('production')).toBe('production');
    expect(normalizeEnv('uat')).toBe('uat');
    expect(normalizeEnv('dev')).toBe('dev');
    expect(normalizeEnv('local')).toBe('local');
  });

  it('maps synonyms', () => {
    expect(normalizeEnv('prod')).toBe('production');
    expect(normalizeEnv('staging')).toBe('uat');
    expect(normalizeEnv('qa')).toBe('uat');
    expect(normalizeEnv('preview')).toBe('uat');
    expect(normalizeEnv('development')).toBe('dev');
    expect(normalizeEnv('test')).toBe('local');
  });

  it('is case- and whitespace-insensitive', () => {
    expect(normalizeEnv('  UAT  ')).toBe('uat');
    expect(normalizeEnv('Production')).toBe('production');
  });

  it('returns "unknown" for empty / null / gibberish', () => {
    expect(normalizeEnv(undefined)).toBe('unknown');
    expect(normalizeEnv(null)).toBe('unknown');
    expect(normalizeEnv('')).toBe('unknown');
    expect(normalizeEnv('   ')).toBe('unknown');
    expect(normalizeEnv('nonsense')).toBe('unknown');
  });
});

describe('resolveServerEnv — env-var priority', () => {
  const KEYS = ['APP_ENV', 'VERCEL_ENV', 'RAILWAY_ENVIRONMENT', 'NODE_ENV'] as const;
  const snapshot: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of KEYS) {
      snapshot[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of KEYS) {
      const v = snapshot[k];
      if (v === undefined) delete process.env[k];
      else (process.env as Record<string, string>)[k] = v;
    }
  });

  it('APP_ENV wins over everything', () => {
    (process.env as Record<string, string>).APP_ENV = 'uat';
    (process.env as Record<string, string>).VERCEL_ENV = 'production';
    (process.env as Record<string, string>).NODE_ENV = 'production';
    expect(resolveServerEnv()).toBe('uat');
  });

  it('falls back to VERCEL_ENV when APP_ENV is unset (preview → uat)', () => {
    (process.env as Record<string, string>).VERCEL_ENV = 'preview';
    expect(resolveServerEnv()).toBe('uat');
  });

  it('falls back to RAILWAY_ENVIRONMENT', () => {
    (process.env as Record<string, string>).RAILWAY_ENVIRONMENT = 'dev';
    expect(resolveServerEnv()).toBe('dev');
  });

  it('falls back to NODE_ENV=production', () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    expect(resolveServerEnv()).toBe('production');
  });

  it('defaults to "local" when no env var is set', () => {
    expect(resolveServerEnv()).toBe('local');
  });

  it('coerces "unknown" (unrecognized synonym) to "local" so we never render a false banner', () => {
    (process.env as Record<string, string>).APP_ENV = 'nonsense-value';
    expect(resolveServerEnv()).toBe('local');
  });
});
