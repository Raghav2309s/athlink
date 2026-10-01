'use strict';

const { query } = require('../../db/pool');
const { coachDiscoverySchema } = require('./discovery.schema');

async function discoverCoaches(req, res, next) {
  try {
    const parsed = coachDiscoverySchema.safeParse({
      sportId: req.query.sportId,
      localityId: req.query.localityId,
    });

    if (!parsed.success) {
      const error = new Error('Invalid discovery filters');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      error.details = parsed.error.issues;
      throw error;
    }

    const { sportId, localityId } = parsed.data;

    const conditions = [];
    const params = [];

    if (sportId) {
      params.push(sportId);
      conditions.push(`cs.sport_id = $${params.length}`);
    }

    if (localityId) {
      params.push(localityId);
      conditions.push(`l.locality_id = $${params.length}`);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    params.push(50);

    const result = await query(
      `SELECT DISTINCT
         c.user_id,
         c.full_name,
         c.bio,
         c.experience_years,
         c.certification,
         c.academy_name,
         c.rating,
         c.is_verified,
         l.id AS location_id,
         loc.id AS locality_id,
         loc.name AS locality_name,
         loc.city,
         loc.state,
         s.id AS sport_id,
         s.name AS sport_name
       FROM coach_profiles c
       JOIN coach_sports cs
         ON cs.coach_user_id = c.user_id
       JOIN sports s
         ON s.id = cs.sport_id
       LEFT JOIN locations l
         ON l.id = c.location_id
       LEFT JOIN localities loc
         ON loc.id = l.locality_id
       ${whereClause}
       ORDER BY c.is_verified DESC, c.rating DESC NULLS LAST, c.full_name
       LIMIT $${params.length}`,
      params,
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

module.exports = {
  discoverCoaches,
};
