'use strict';

const crypto = require('crypto');

const { env } = require('../../config/env');
const { query } = require('../../db/pool');
const {
  hashPassword,
  verifyPassword,
  createSessionToken,
} = require('../../lib/auth');
const {
  loginSchema,
  registerSchema,
} = require('./auth.schema');

function setSessionCookie(res, token) {
  const maxAge = 8 * 60 * 60 * 1000;

  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(env.COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

async function register(req, res, next) {
  try {
    const input = registerSchema.parse(req.body);

    const email = input.email.toLowerCase();

    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length) {
      return res.status(409).json({
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists',
        },
      });
    }

    const passwordHash = await hashPassword(
      input.password,
      env.BCRYPT_COST
    );

    const result = await query(
      `
        INSERT INTO users (
          email,
          password_hash,
          role
        )
        VALUES ($1, $2, $3)
        RETURNING id, email, role, is_active, created_at
      `,
      [email, passwordHash, input.role]
    );

    const user = result.rows[0];

    return res.status(201).json({
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const input = loginSchema.parse(req.body);

    const email = input.email.toLowerCase();

    const result = await query(
      `
        SELECT
          id,
          email,
          password_hash,
          role,
          is_active,
          token_version
        FROM users
        WHERE email = $1
      `,
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'This account is disabled',
        },
      });
    }

    const validPassword = await verifyPassword(
      input.password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const token = createSessionToken();
    const tokenHash = hashToken(token);

    await query(
      `
        INSERT INTO auth_sessions (
          user_id,
          token_hash,
          expires_at
        )
        VALUES (
          $1,
          $2,
          NOW() + INTERVAL '8 hours'
        )
      `,
      [user.id, tokenHash]
    );

    setSessionCookie(res, token);

    return res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.[env.COOKIE_NAME];

    if (token) {
      await query(
        `
          DELETE FROM auth_sessions
          WHERE token_hash = $1
        `,
        [hashToken(token)]
      );
    }

    clearSessionCookie(res);

    return res.json({
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  return res.json({
    data: {
      user: req.user,
    },
  });
}

module.exports = {
  register,
  login,
  logout,
  me,
};