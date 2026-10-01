'use strict';

const { query, withTransaction } = require('../../db/pool');
const {
  playerProfileSchema,
  coachProfileSchema,
  organizationProfileSchema,
  sportsUpdateSchema,
} = require('./profile.schema');

function validationError(error) {
  const err = new Error('Invalid profile data');
  err.statusCode = 400;
  err.code = 'VALIDATION_ERROR';
  err.details = error.issues;
  return err;
}

async function getProfile(req, res, next) {
  try {
    const { id: userId, role } = req.user;

    if (role === 'PLAYER') {
      const result = await query(
        `SELECT
           p.user_id,
           u.email,
           u.role,
           p.full_name,
           p.date_of_birth::text AS date_of_birth,
           p.bio,
           p.experience_level,
           p.university,
           p.location_id,
           p.is_verified,
           l.locality_id,
           loc.name AS locality_name,
           loc.city,
           loc.state,
           COALESCE(
             json_agg(
               json_build_object(
                 'sportId', s.id,
                 'sportName', s.name,
                 'isPrimary', ps.is_primary,
                 'yearsExperience', ps.years_experience
               )
               ORDER BY ps.is_primary DESC, s.name
             ) FILTER (WHERE s.id IS NOT NULL),
             '[]'::json
           ) AS sports
         FROM player_profiles p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN locations l ON l.id = p.location_id
         LEFT JOIN localities loc ON loc.id = l.locality_id
         LEFT JOIN player_sports ps ON ps.player_user_id = p.user_id
         LEFT JOIN sports s ON s.id = ps.sport_id
         WHERE p.user_id = $1
         GROUP BY
           p.user_id, u.email, u.role, p.full_name, p.date_of_birth::text,
           p.bio, p.experience_level, p.university, p.location_id,
           p.is_verified, l.locality_id, loc.name, loc.city, loc.state`,
        [userId],
      );

      if (!result.rows[0]) {
        return res.json({ data: null });
      }

      return res.json({ data: result.rows[0] });
    }

    if (role === 'COACH') {
      const result = await query(
        `SELECT
           c.user_id,
           u.email,
           u.role,
           c.full_name,
           c.bio,
           c.experience_years,
           c.certification,
           c.academy_name,
           c.rating,
           c.location_id,
           c.is_verified,
           l.locality_id,
           loc.name AS locality_name,
           loc.city,
           loc.state,
           COALESCE(
             json_agg(
               json_build_object(
                 'sportId', s.id,
                 'sportName', s.name,
                 'isPrimary', cs.is_primary
               )
               ORDER BY cs.is_primary DESC, s.name
             ) FILTER (WHERE s.id IS NOT NULL),
             '[]'::json
           ) AS sports
         FROM coach_profiles c
         JOIN users u ON u.id = c.user_id
         LEFT JOIN locations l ON l.id = c.location_id
         LEFT JOIN localities loc ON loc.id = l.locality_id
         LEFT JOIN coach_sports cs ON cs.coach_user_id = c.user_id
         LEFT JOIN sports s ON s.id = cs.sport_id
         WHERE c.user_id = $1
         GROUP BY
           c.user_id, u.email, u.role, c.full_name, c.bio,
           c.experience_years, c.certification, c.academy_name,
           c.rating, c.location_id, c.is_verified,
           l.locality_id, loc.name, loc.city, loc.state`,
        [userId],
      );

      if (!result.rows[0]) {
        return res.json({ data: null });
      }

      return res.json({ data: result.rows[0] });
    }

    if (role === 'ORGANIZATION') {
      const result = await query(
        `SELECT
           o.id,
           o.name,
           o.type,
           o.description,
           o.contact_email,
           o.contact_phone,
           o.website_url,
           o.location_id,
           o.is_verified,
           l.locality_id,
           loc.name AS locality_name,
           loc.city,
           loc.state
         FROM organizations o
         LEFT JOIN locations l ON l.id = o.location_id
         LEFT JOIN localities loc ON loc.id = l.locality_id
         WHERE o.contact_email = $1
         LIMIT 1`,
        [req.user.email],
      );

      return res.json({ data: result.rows[0] || null });
    }

    return res.status(403).json({
      error: {
        code: 'UNSUPPORTED_ROLE',
        message: 'This role does not have a profile',
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { id: userId, role, email } = req.user;

    if (role === 'PLAYER') {
      const parsed = playerProfileSchema.safeParse(req.body);

      if (!parsed.success) {
        throw validationError(parsed.error);
      }

      const data = parsed.data;

      const result = await query(
        `INSERT INTO player_profiles
          (
            user_id,
            full_name,
            date_of_birth,
            bio,
            experience_level,
            university,
            location_id
          )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id)
         DO UPDATE SET
           full_name = EXCLUDED.full_name,
           date_of_birth = EXCLUDED.date_of_birth,
           bio = EXCLUDED.bio,
           experience_level = EXCLUDED.experience_level,
           university = EXCLUDED.university,
           location_id = EXCLUDED.location_id,
           updated_at = NOW()
         RETURNING *`,
        [
          userId,
          data.fullName,
          data.dateOfBirth ?? null,
          data.bio ?? null,
          data.experienceLevel ?? null,
          data.university ?? null,
          data.locationId ?? null,
        ],
      );

      return res.json({ data: result.rows[0] });
    }

    if (role === 'COACH') {
      const parsed = coachProfileSchema.safeParse(req.body);

      if (!parsed.success) {
        throw validationError(parsed.error);
      }

      const data = parsed.data;

      const result = await query(
        `INSERT INTO coach_profiles
          (
            user_id,
            full_name,
            bio,
            experience_years,
            certification,
            academy_name,
            location_id
          )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id)
         DO UPDATE SET
           full_name = EXCLUDED.full_name,
           bio = EXCLUDED.bio,
           experience_years = EXCLUDED.experience_years,
           certification = EXCLUDED.certification,
           academy_name = EXCLUDED.academy_name,
           location_id = EXCLUDED.location_id,
           updated_at = NOW()
         RETURNING *`,
        [
          userId,
          data.fullName,
          data.bio ?? null,
          data.experienceYears ?? null,
          data.certification ?? null,
          data.academyName ?? null,
          data.locationId ?? null,
        ],
      );

      return res.json({ data: result.rows[0] });
    }

    if (role === 'ORGANIZATION') {
      const parsed = organizationProfileSchema.safeParse(req.body);

      if (!parsed.success) {
        throw validationError(parsed.error);
      }

      const data = parsed.data;

      const existing = await query(
        `SELECT id
         FROM organizations
         WHERE contact_email = $1
         LIMIT 1`,
        [email],
      );

      let result;

      if (existing.rows[0]) {
        result = await query(
          `UPDATE organizations
           SET
             name = $1,
             type = $2,
             description = $3,
             contact_email = $4,
             contact_phone = $5,
             website_url = $6,
             location_id = $7,
             updated_at = NOW()
           WHERE id = $8
           RETURNING *`,
          [
            data.name,
            data.type,
            data.description ?? null,
            data.contactEmail ?? email,
            data.contactPhone ?? null,
            data.websiteUrl ?? null,
            data.locationId ?? null,
            existing.rows[0].id,
          ],
        );
      } else {
        result = await query(
          `INSERT INTO organizations
            (
              name,
              type,
              description,
              contact_email,
              contact_phone,
              website_url,
              location_id
            )
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            data.name,
            data.type,
            data.description ?? null,
            data.contactEmail ?? email,
            data.contactPhone ?? null,
            data.websiteUrl ?? null,
            data.locationId ?? null,
          ],
        );
      }

      return res.json({ data: result.rows[0] });
    }

    return res.status(403).json({
      error: {
        code: 'UNSUPPORTED_ROLE',
        message: 'This role does not have a profile',
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateSports(req, res, next) {
  try {
    const { id: userId, role } = req.user;

    if (role !== 'PLAYER' && role !== 'COACH') {
      return res.status(403).json({
        error: {
          code: 'UNSUPPORTED_ROLE',
          message: 'Only players and coaches can manage sports',
        },
      });
    }

    const parsed = sportsUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const sports = parsed.data.sports;

    const sportIds = sports.map((sport) => sport.sportId);

    if (sportIds.length > 0) {
      const existing = await query(
        `SELECT id
         FROM sports
         WHERE id = ANY($1::uuid[])
           AND is_active = true`,
        [sportIds],
      );

      if (existing.rows.length !== new Set(sportIds).size) {
        const error = new Error('One or more sports are invalid');
        error.statusCode = 400;
        error.code = 'INVALID_SPORT';
        throw error;
      }
    }

    await query('BEGIN');

    try {
      if (role === 'PLAYER') {
        await query(
          'DELETE FROM player_sports WHERE player_user_id = $1',
          [userId],
        );

        for (const sport of sports) {
          await query(
            `INSERT INTO player_sports
              (
                player_user_id,
                sport_id,
                is_primary,
                years_experience
              )
             VALUES ($1, $2, $3, $4)`,
            [
              userId,
              sport.sportId,
              sport.isPrimary ?? false,
              sport.yearsExperience ?? null,
            ],
          );
        }
      } else {
        await query(
          'DELETE FROM coach_sports WHERE coach_user_id = $1',
          [userId],
        );

        for (const sport of sports) {
          await query(
            `INSERT INTO coach_sports
              (
                coach_user_id,
                sport_id,
                is_primary
              )
             VALUES ($1, $2, $3)`,
            [
              userId,
              sport.sportId,
              sport.isPrimary ?? false,
            ],
          );
        }
      }

      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

    return res.json({
      data: {
        sports,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  updateSports,
};



