'use strict';

const crypto = require('crypto');

const { query } = require('../db/pool');

function getSessionToken(req) {
  const cookieHeader = req.headers.cookie || '';

  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((part) => part.trim().split('='))
      .filter((part) => part.length === 2)
  );

  return cookies.athlink_session || null;
}

async function requireAuth(req, res, next) {
  try {
    const token = getSessionToken(req);

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required',
        },
      });
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const result = await query(
      `
        SELECT
          id,
          email,
          role,
          is_active,
          token_version
        FROM users
        WHERE id = (
          SELECT user_id
          FROM auth_sessions
          WHERE token_hash = $1
            AND expires_at > NOW()
        )
      `,
      [tokenHash]
    );

    if (!result.rows.length || !result.rows[0].is_active) {
      return res.status(401).json({
        error: {
          code: 'INVALID_SESSION',
          message: 'Invalid or expired session',
        },
      });
    }

    req.user = result.rows[0];

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireAuth,
};