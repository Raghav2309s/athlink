'use strict';

/**
 * Environment configuration loader + validator.
 *
 * - Loads backend/.env via dotenv.
 * - Validates process.env against a Zod schema.
 * - Fails fast on missing/invalid required variables.
 * - Never logs secret values.
 */

const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  PORT: z.coerce
    .number({ invalid_type_error: 'PORT must be a number' })
    .int('PORT must be an integer')
    .min(1, 'PORT must be >= 1')
    .max(65535, 'PORT must be <= 65535')
    .default(4000),

  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .min(1, 'DATABASE_URL is required')
    .refine(isPostgresConnectionString, {
      message:
        'DATABASE_URL must be a valid postgres:// or postgresql:// connection string',
    }),

  DATABASE_URL_DIRECT: z
    .string({ required_error: 'DATABASE_URL_DIRECT is required' })
    .min(1, 'DATABASE_URL_DIRECT is required')
    .refine(isPostgresConnectionString, {
      message:
        'DATABASE_URL_DIRECT must be a valid postgres:// or postgresql:// connection string',
    }),

  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(
      32,
      'JWT_SECRET must be at least 32 characters'
    ),

  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN must look like "8h", "30m", or "7d"')
    .default('8h'),

  CORS_ORIGIN: z
    .string({ required_error: 'CORS_ORIGIN is required' })
    .url('CORS_ORIGIN must be a valid URL, e.g. http://localhost:5173'),

  COOKIE_NAME: z
    .string()
    .min(1, 'COOKIE_NAME cannot be empty')
    .default('athlink_session'),

  LOG_LEVEL: z
    .enum(
      ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'],
      {
        errorMap: () => ({
          message:
            'LOG_LEVEL must be one of: trace, debug, info, warn, error, fatal, silent',
        }),
      }
    )
    .default('debug'),

  DEMO_MODE: z
    .enum(['true', 'false'], {
      errorMap: () => ({
        message: 'DEMO_MODE must be "true" or "false"',
      }),
    })
    .default('true')
    .transform((v) => v === 'true'),

  ALLOW_DEMO_SEED: z
    .enum(['true', 'false'], {
      errorMap: () => ({
        message: 'ALLOW_DEMO_SEED must be "true" or "false"',
      }),
    })
    .default('false')
    .transform((v) => v === 'true'),

  BCRYPT_COST: z.coerce
    .number({ invalid_type_error: 'BCRYPT_COST must be a number' })
    .int('BCRYPT_COST must be an integer')
    .min(10, 'BCRYPT_COST must be >= 10')
    .max(15, 'BCRYPT_COST must be <= 15')
    .default(12),
});

function isPostgresConnectionString(value) {
  if (!/^postgres(ql)?:\/\//.test(value)) return false;

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function formatZodError(error) {
  const lines = error.issues.map((issue) => {
    const field = issue.path.join('.') || '(root)';
    return `  - ${field}: ${issue.message}`;
  });

  return [
    'Invalid or missing environment variables.',
    'Check backend/.env against backend/.env.example.',
    '',
    ...lines,
  ].join('\n');
}

function parseEnv(rawEnv) {
  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    console.error(formatZodError(parsed.error));
    throw new Error('Environment validation failed. See errors above.');
  }

  return Object.freeze(parsed.data);
}

const env = parseEnv(process.env);

module.exports = { env, parseEnv };
