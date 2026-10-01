'use strict';

const { query, withTransaction } = require('../../db/pool');
const {
  createTrainingRequestSchema,
  updateTrainingRequestSchema,
} = require('./training.schema');

function validationError(error) {
  const err = new Error('Invalid training request data');
  err.statusCode = 400;
  err.code = 'VALIDATION_ERROR';
  err.details = error.issues;
  return err;
}

function apiError(message, statusCode, code) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

async function createTrainingRequest(req, res, next) {
  try {
    if (req.user.role !== 'PLAYER') {
      throw apiError(
        'Only players can create training requests',
        403,
        'FORBIDDEN',
      );
    }

    const parsed = createTrainingRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const { coachUserId, sportId, message } = parsed.data;
    const playerUserId = req.user.id;

    const playerProfile = await query(
      `SELECT user_id
       FROM player_profiles
       WHERE user_id = $1`,
      [playerUserId],
    );

    if (!playerProfile.rows[0]) {
      throw apiError(
        'Create your player profile before sending a training request',
        409,
        'PROFILE_REQUIRED',
      );
    }

    const coach = await query(
      `SELECT u.id, u.is_active
       FROM users u
       JOIN coach_profiles c
         ON c.user_id = u.id
       JOIN coach_sports cs
         ON cs.coach_user_id = c.user_id
       WHERE u.id = $1
         AND u.role = 'COACH'
         AND u.is_active = true
         AND cs.sport_id = $2`,
      [coachUserId, sportId],
    );

    if (!coach.rows[0]) {
      throw apiError(
        'Coach not found or coach does not offer this sport',
        404,
        'COACH_SPORT_NOT_FOUND',
      );
    }

    const playerSport = await query(
      `SELECT 1
       FROM player_sports
       WHERE player_user_id = $1
         AND sport_id = $2`,
      [playerUserId, sportId],
    );

    if (!playerSport.rows[0]) {
      throw apiError(
        'Add this sport to your player profile before requesting training',
        409,
        'PLAYER_SPORT_REQUIRED',
      );
    }

    const pendingCount = await query(
      `SELECT COUNT(*)::int AS count
       FROM training_requests
       WHERE player_user_id = $1
         AND status = 'PENDING'`,
      [playerUserId],
    );

    if (pendingCount.rows[0].count >= 5) {
      throw apiError(
        'A player can have at most 5 pending training requests',
        409,
        'PENDING_REQUEST_LIMIT',
      );
    }

    const duplicate = await query(
      `SELECT id
       FROM training_requests
       WHERE player_user_id = $1
         AND coach_user_id = $2
         AND sport_id = $3
         AND status = 'PENDING'
       LIMIT 1`,
      [playerUserId, coachUserId, sportId],
    );

    if (duplicate.rows[0]) {
      throw apiError(
        'A pending request already exists for this coach and sport',
        409,
        'DUPLICATE_PENDING_REQUEST',
      );
    }

    const result = await query(
      `INSERT INTO training_requests
        (
          player_user_id,
          coach_user_id,
          sport_id,
          message,
          status
        )
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING id,
                 player_user_id,
                 coach_user_id,
                 sport_id,
                 message,
                 status,
                 requested_at,
                 responded_at,
                 updated_at`,
      [playerUserId, coachUserId, sportId, message ?? null],
    );

    return res.status(201).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function listTrainingRequests(req, res, next) {
  try {
    if (req.user.role !== 'PLAYER' && req.user.role !== 'COACH') {
      throw apiError(
        'Only players and coaches can view training requests',
        403,
        'FORBIDDEN',
      );
    }

    const column =
      req.user.role === 'PLAYER'
        ? 'tr.player_user_id'
        : 'tr.coach_user_id';

    const result = await query(
      `SELECT
         tr.id,
         tr.player_user_id,
         p.full_name AS player_name,
         tr.coach_user_id,
         c.full_name AS coach_name,
         tr.sport_id,
         s.name AS sport_name,
         tr.message,
         tr.status,
         tr.requested_at,
         tr.responded_at,
         tr.updated_at
       FROM training_requests tr
       JOIN player_profiles p
         ON p.user_id = tr.player_user_id
       JOIN coach_profiles c
         ON c.user_id = tr.coach_user_id
       JOIN sports s
         ON s.id = tr.sport_id
       WHERE ${column} = $1
       ORDER BY tr.requested_at DESC`,
      [req.user.id],
    );

    return res.json({
      data: result.rows,
      meta: {
        count: result.rows.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateTrainingRequest(req, res, next) {
  try {
    if (req.user.role !== 'COACH') {
      throw apiError(
        'Only the assigned coach can accept or reject a training request',
        403,
        'FORBIDDEN',
      );
    }

    const requestId = req.params.id;

    const parsed = updateTrainingRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const { status } = parsed.data;

    const result = await withTransaction(async (client) => {
      const requestResult = await client.query(
        `SELECT id, status
         FROM training_requests
         WHERE id = $1
           AND coach_user_id = $2
         FOR UPDATE`,
        [requestId, req.user.id],
      );

      const request = requestResult.rows[0];

      if (!request) {
        throw apiError(
          'Training request not found',
          404,
          'REQUEST_NOT_FOUND',
        );
      }

      if (request.status !== 'PENDING') {
        throw apiError(
          'Only pending requests can be updated',
          409,
          'REQUEST_NOT_PENDING',
        );
      }

      const updated = await client.query(
        `UPDATE training_requests
         SET
           status = $1,
           responded_at = NOW(),
           updated_at = NOW()
         WHERE id = $2
         RETURNING id,
                   player_user_id,
                   coach_user_id,
                   sport_id,
                   message,
                   status,
                   requested_at,
                   responded_at,
                   updated_at`,
        [status, requestId],
      );

      return updated.rows[0];
    });

    return res.json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTrainingRequest,
  listTrainingRequests,
  updateTrainingRequest,
};
