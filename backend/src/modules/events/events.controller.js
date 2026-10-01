'use strict';

const { query, withTransaction } = require('../../db/pool');
const {
  createEventSchema,
  updateEventSchema,
} = require('./events.schema');

function validationError(error) {
  const err = new Error('Invalid event data');
  err.statusCode = 400;
  err.code = 'VALIDATION_ERROR';
  err.details = error.issues;
  return err;
}

function apiError(statusCode, code, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

function parseBody(schema, body) {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw validationError(result.error);
  }

  return result.data;
}

async function getOrganizationForUser(user) {
  const result = await query(
    `
      SELECT
        id,
        name,
        type,
        is_verified
      FROM organizations
      WHERE LOWER(contact_email) = LOWER($1)
      LIMIT 1
    `,
    [user.email]
  );

  return result.rows[0] || null;
}

async function validateReferences(data) {
  const sport = await query(
    `
      SELECT id, name
      FROM sports
      WHERE id = $1
        AND is_active = TRUE
    `,
    [data.sportId]
  );

  if (sport.rowCount === 0) {
    throw apiError(
      400,
      'INVALID_SPORT',
      'The selected sport does not exist or is inactive.'
    );
  }

  if (data.facilityId) {
    const facility = await query(
      `
        SELECT id
        FROM facilities
        WHERE id = $1
      `,
      [data.facilityId]
    );

    if (facility.rowCount === 0) {
      throw apiError(
        400,
        'INVALID_FACILITY',
        'The selected facility does not exist.'
      );
    }
  }

  if (data.locationId) {
    const location = await query(
      `
        SELECT id
        FROM locations
        WHERE id = $1
      `,
      [data.locationId]
    );

    if (location.rowCount === 0) {
      throw apiError(
        400,
        'INVALID_LOCATION',
        'The selected location does not exist.'
      );
    }
  }
}

function validateEventTimes(startsAt, endsAt) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    throw apiError(
      400,
      'INVALID_EVENT_TIME',
      'endsAt must be later than startsAt.'
    );
  }
}

async function createEvent(req, res, next) {
  try {
    if (req.user.role !== 'ORGANIZATION') {
      throw apiError(
        403,
        'FORBIDDEN',
        'Only organization users can create events.'
      );
    }

    const data = parseBody(createEventSchema, req.body);

    validateEventTimes(data.startsAt, data.endsAt);
    await validateReferences(data);

    const organization = await getOrganizationForUser(req.user);

    if (!organization) {
      throw apiError(
        409,
        'ORGANIZATION_PROFILE_REQUIRED',
        'Create an organization profile before creating events.'
      );
    }

    const result = await query(
      `
        INSERT INTO events (
          organization_id,
          created_by_user_id,
          sport_id,
          facility_id,
          location_id,
          title,
          description,
          category,
          status,
          starts_at,
          ends_at,
          capacity,
          eligibility_text
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, 'DRAFT',
          $9, $10, $11, $12
        )
        RETURNING *
      `,
      [
        organization.id,
        req.user.id,
        data.sportId,
        data.facilityId || null,
        data.locationId || null,
        data.title,
        data.description || null,
        data.category,
        data.startsAt,
        data.endsAt,
        data.capacity || null,
        data.eligibilityText || null,
      ]
    );

    res.status(201).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function listEvents(req, res, next) {
  try {
    const {
      sportId,
      category,
      localityId,
      upcoming,
    } = req.query;

    const values = [];
    const conditions = [];

    if (req.user.role === 'PLAYER') {
      conditions.push(`e.status = 'PUBLISHED'`);
    } else if (req.user.role === 'ORGANIZATION') {
      conditions.push(`
        (
          e.status = 'PUBLISHED'
          OR e.organization_id = (
            SELECT id
            FROM organizations
            WHERE LOWER(contact_email) = LOWER($1)
            LIMIT 1
          )
        )
      `);
      values.push(req.user.email);
    } else {
      conditions.push(`e.status = 'PUBLISHED'`);
    }

    if (sportId) {
      values.push(sportId);
      conditions.push(`e.sport_id = $${values.length}`);
    }

    if (category) {
      values.push(category);
      conditions.push(`e.category = $${values.length}`);
    }

    if (localityId) {
      values.push(localityId);
      conditions.push(`l.locality_id = $${values.length}`);
    }

    if (upcoming === 'true') {
      conditions.push(`e.starts_at >= NOW()`);
    }

    values.push(50);

    const result = await query(
      `
        SELECT
          e.id,
          e.title,
          e.description,
          e.category,
          e.status,
          e.starts_at,
          e.ends_at,
          e.capacity,
          e.eligibility_text,
          e.created_at,
          s.id AS sport_id,
          s.name AS sport_name,
          o.id AS organization_id,
          o.name AS organization_name,
          f.id AS facility_id,
          f.name AS facility_name,
          loc.id AS location_id,
          loc.address_text,
          loc.latitude,
          loc.longitude,
          lo.id AS locality_id,
          lo.name AS locality_name,
          COUNT(
            CASE
              WHEN er.status = 'REGISTERED' THEN 1
            END
          )::integer AS registered_count
        FROM events e
        JOIN sports s
          ON s.id = e.sport_id
        LEFT JOIN organizations o
          ON o.id = e.organization_id
        LEFT JOIN facilities f
          ON f.id = e.facility_id
        LEFT JOIN locations loc
          ON loc.id = e.location_id
        LEFT JOIN localities lo
          ON lo.id = loc.locality_id
        LEFT JOIN event_registrations er
          ON er.event_id = e.id
        WHERE ${conditions.join(' AND ')}
        GROUP BY
          e.id,
          s.id,
          s.name,
          o.id,
          o.name,
          f.id,
          f.name,
          loc.id,
          loc.address_text,
          loc.latitude,
          loc.longitude,
          lo.id,
          lo.name
        ORDER BY e.starts_at ASC
        LIMIT $${values.length}
      `,
      values
    );

    res.json({
      data: result.rows,
      meta: {
        count: result.rowCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getEvent(req, res, next) {
  try {
    const result = await query(
      `
        SELECT
          e.id,
          e.title,
          e.description,
          e.category,
          e.status,
          e.starts_at,
          e.ends_at,
          e.capacity,
          e.eligibility_text,
          e.created_at,
          e.updated_at,
          s.id AS sport_id,
          s.name AS sport_name,
          o.id AS organization_id,
          o.name AS organization_name,
          f.id AS facility_id,
          f.name AS facility_name,
          loc.id AS location_id,
          loc.address_text,
          loc.latitude,
          loc.longitude,
          lo.id AS locality_id,
          lo.name AS locality_name,
          COUNT(
            CASE
              WHEN er.status = 'REGISTERED' THEN 1
            END
          )::integer AS registered_count
        FROM events e
        JOIN sports s
          ON s.id = e.sport_id
        LEFT JOIN organizations o
          ON o.id = e.organization_id
        LEFT JOIN facilities f
          ON f.id = e.facility_id
        LEFT JOIN locations loc
          ON loc.id = e.location_id
        LEFT JOIN localities lo
          ON lo.id = loc.locality_id
        LEFT JOIN event_registrations er
          ON er.event_id = e.id
        WHERE e.id = $1
        GROUP BY
          e.id,
          s.id,
          s.name,
          o.id,
          o.name,
          f.id,
          f.name,
          loc.id,
          loc.address_text,
          loc.latitude,
          loc.longitude,
          lo.id,
          lo.name
      `,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      throw apiError(404, 'EVENT_NOT_FOUND', 'Event not found.');
    }

    const event = result.rows[0];

    if (event.status !== 'PUBLISHED') {
      let canView = false;

      if (req.user.role === 'ORGANIZATION') {
        const organization = await getOrganizationForUser(req.user);
        canView =
          organization &&
          organization.id === event.organization_id;
      }

      if (!canView) {
        throw apiError(404, 'EVENT_NOT_FOUND', 'Event not found.');
      }
    }

    res.json({
      data: event,
    });
  } catch (error) {
    next(error);
  }
}

async function updateEvent(req, res, next) {
  try {
    if (req.user.role !== 'ORGANIZATION') {
      throw apiError(
        403,
        'FORBIDDEN',
        'Only organization users can update events.'
      );
    }

    const data = parseBody(updateEventSchema, req.body);

    const organization = await getOrganizationForUser(req.user);

    if (!organization) {
      throw apiError(
        409,
        'ORGANIZATION_PROFILE_REQUIRED',
        'Organization profile not found.'
      );
    }

    const existingResult = await query(
      `
        SELECT *
        FROM events
        WHERE id = $1
          AND organization_id = $2
      `,
      [req.params.id, organization.id]
    );

    if (existingResult.rowCount === 0) {
      throw apiError(404, 'EVENT_NOT_FOUND', 'Event not found.');
    }

    const existing = existingResult.rows[0];

    if (existing.status !== 'DRAFT') {
      throw apiError(
        409,
        'EVENT_NOT_EDITABLE',
        'Only draft events can be edited.'
      );
    }

    const effectiveStartsAt =
      data.startsAt || existing.starts_at.toISOString();

    const effectiveEndsAt =
      data.endsAt || existing.ends_at.toISOString();

    validateEventTimes(effectiveStartsAt, effectiveEndsAt);

    await validateReferences({
      sportId: data.sportId || existing.sport_id,
      facilityId:
        data.facilityId !== undefined
          ? data.facilityId
          : existing.facility_id,
      locationId:
        data.locationId !== undefined
          ? data.locationId
          : existing.location_id,
    });

    const fields = [];
    const values = [];

    const map = {
      title: 'title',
      sportId: 'sport_id',
      category: 'category',
      startsAt: 'starts_at',
      endsAt: 'ends_at',
      description: 'description',
      facilityId: 'facility_id',
      locationId: 'location_id',
      capacity: 'capacity',
      eligibilityText: 'eligibility_text',
    };

    for (const [key, column] of Object.entries(map)) {
      if (data[key] !== undefined) {
        values.push(data[key]);
        fields.push(`${column} = $${values.length}`);
      }
    }

    if (fields.length === 0) {
      return res.json({
        data: existing,
      });
    }

    values.push(req.params.id);

    const result = await query(
      `
        UPDATE events
        SET
          ${fields.join(', ')},
          updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING *
      `,
      values
    );

    res.json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function publishEvent(req, res, next) {
  try {
    if (req.user.role !== 'ORGANIZATION') {
      throw apiError(
        403,
        'FORBIDDEN',
        'Only organization users can publish events.'
      );
    }

    const organization = await getOrganizationForUser(req.user);

    if (!organization) {
      throw apiError(
        409,
        'ORGANIZATION_PROFILE_REQUIRED',
        'Organization profile not found.'
      );
    }

    const result = await query(
      `
        UPDATE events
        SET
          status = 'PUBLISHED',
          updated_at = NOW()
        WHERE id = $1
          AND organization_id = $2
          AND status = 'DRAFT'
        RETURNING *
      `,
      [req.params.id, organization.id]
    );

    if (result.rowCount === 0) {
      throw apiError(
        409,
        'EVENT_NOT_PUBLISHABLE',
        'Event was not found, is not owned by this organization, or is already published.'
      );
    }

    res.json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function registerForEvent(req, res, next) {
  try {
    if (req.user.role !== 'PLAYER') {
      throw apiError(
        403,
        'FORBIDDEN',
        'Only players can register for events.'
      );
    }

    const result = await withTransaction(async (client) => {
      const eventResult = await client.query(
        `
          SELECT
            id,
            sport_id,
            status,
            starts_at,
            capacity
          FROM events
          WHERE id = $1
          FOR UPDATE
        `,
        [req.params.id]
      );

      if (eventResult.rowCount === 0) {
        throw apiError(404, 'EVENT_NOT_FOUND', 'Event not found.');
      }

      const event = eventResult.rows[0];

      if (event.status !== 'PUBLISHED') {
        throw apiError(
          409,
          'EVENT_NOT_OPEN',
          'This event is not open for registration.'
        );
      }

      if (new Date(event.starts_at) <= new Date()) {
        throw apiError(
          409,
          'EVENT_STARTED',
          'Registration is closed because the event has started.'
        );
      }

      const sportResult = await client.query(
        `
          SELECT 1
          FROM player_sports
          WHERE player_user_id = $1
            AND sport_id = $2
        `,
        [req.user.id, event.sport_id]
      );

      if (sportResult.rowCount === 0) {
        throw apiError(
          409,
          'SPORT_NOT_SELECTED',
          'Add this sport to your player profile before registering.'
        );
      }

      const countResult = await client.query(
        `
          SELECT COUNT(*)::integer AS registered_count
          FROM event_registrations
          WHERE event_id = $1
            AND status = 'REGISTERED'
        `,
        [event.id]
      );

      const registeredCount = countResult.rows[0].registered_count;

      if (
        event.capacity !== null &&
        registeredCount >= event.capacity
      ) {
        throw apiError(
          409,
          'EVENT_FULL',
          'This event has reached its registration capacity.'
        );
      }

      const existingResult = await client.query(
        `
          SELECT id, status
          FROM event_registrations
          WHERE event_id = $1
            AND player_user_id = $2
          FOR UPDATE
        `,
        [event.id, req.user.id]
      );

      let registration;

      if (existingResult.rowCount > 0) {
        const existing = existingResult.rows[0];

        if (existing.status === 'REGISTERED') {
          throw apiError(
            409,
            'ALREADY_REGISTERED',
            'You are already registered for this event.'
          );
        }

        const updated = await client.query(
          `
            UPDATE event_registrations
            SET
              status = 'REGISTERED',
              registered_at = NOW(),
              updated_at = NOW()
            WHERE id = $1
            RETURNING *
          `,
          [existing.id]
        );

        registration = updated.rows[0];
      } else {
        const inserted = await client.query(
          `
            INSERT INTO event_registrations (
              event_id,
              player_user_id,
              status
            )
            VALUES ($1, $2, 'REGISTERED')
            RETURNING *
          `,
          [event.id, req.user.id]
        );

        registration = inserted.rows[0];
      }

      return registration;
    });

    res.status(201).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function listRegistrations(req, res, next) {
  try {
    if (req.user.role !== 'ORGANIZATION') {
      throw apiError(
        403,
        'FORBIDDEN',
        'Only organizations can view event registrations.'
      );
    }

    const organization = await getOrganizationForUser(req.user);

    if (!organization) {
      throw apiError(
        409,
        'ORGANIZATION_PROFILE_REQUIRED',
        'Organization profile not found.'
      );
    }

    const result = await query(
      `
        SELECT
          er.id,
          er.status,
          er.registered_at,
          er.updated_at,
          pp.user_id AS player_user_id,
          pp.full_name,
          pp.experience_level,
          pp.university
        FROM event_registrations er
        JOIN events e
          ON e.id = er.event_id
        JOIN player_profiles pp
          ON pp.user_id = er.player_user_id
        WHERE er.event_id = $1
          AND e.organization_id = $2
        ORDER BY er.registered_at ASC
      `,
      [req.params.id, organization.id]
    );

    res.json({
      data: result.rows,
      meta: {
        count: result.rowCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  publishEvent,
  registerForEvent,
  listRegistrations,
};

