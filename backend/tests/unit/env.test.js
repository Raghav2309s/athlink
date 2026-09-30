'use strict';

function validEnv(overrides = {}) {
  return {
    NODE_ENV: 'development',
    PORT: '4000',
    DATABASE_URL: 'postgresql://athlink_app:pw@localhost:5432/athlink_dev',
    DATABASE_URL_DIRECT: 'postgresql://athlink_app:pw@localhost:5432/athlink_dev',
    JWT_SECRET: 'a'.repeat(32),
    JWT_EXPIRES_IN: '8h',
    CORS_ORIGIN: 'http://localhost:5173',
    COOKIE_NAME: 'athlink_session',
    LOG_LEVEL: 'debug',
    DEMO_MODE: 'true',
    ALLOW_DEMO_SEED: 'false',
    BCRYPT_COST: '12',
    ...overrides,
  };
}

describe('env validation', () => {
  it('parses a valid environment successfully', () => {
    const env = parseEnv(validEnv());

    expect(env.PORT).toBe(4000);
    expect(env.BCRYPT_COST).toBe(12);
    expect(env.DEMO_MODE).toBe(true);
    expect(env.ALLOW_DEMO_SEED).toBe(false);
    expect(env.NODE_ENV).toBe('development');
  });

  it('fails when JWT_SECRET is missing', () => {
    const bad = validEnv();
    delete bad.JWT_SECRET;

    expect(() => parseEnv(bad)).toThrow(/Environment validation failed/);
  });

  it('fails when JWT_SECRET is weak', () => {
    const bad = validEnv({
      JWT_SECRET: 'too-short',
    });

    expect(() => parseEnv(bad)).toThrow(/Environment validation failed/);
  });

  it('fails when PORT is not a number', () => {
    const bad = validEnv({
      PORT: 'not-a-number',
    });

    expect(() => parseEnv(bad)).toThrow(/Environment validation failed/);
  });
});

const { parseEnv } = require('../../src/config/env');