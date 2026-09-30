exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('events', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    organization_id: {
      type: 'uuid',
      references: 'organizations(id)',
      onDelete: 'SET NULL',
    },
    created_by_user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'RESTRICT',
    },
    sport_id: {
      type: 'uuid',
      notNull: true,
      references: 'sports(id)',
      onDelete: 'RESTRICT',
    },
    facility_id: {
      type: 'uuid',
      references: 'facilities(id)',
      onDelete: 'SET NULL',
    },
    location_id: {
      type: 'uuid',
      references: 'locations(id)',
      onDelete: 'SET NULL',
    },
    title: {
      type: 'varchar(200)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    category: {
      type: 'varchar(32)',
      notNull: true,
      default: 'OTHER',
    },
    status: {
      type: 'varchar(16)',
      notNull: true,
      default: 'DRAFT',
    },
    starts_at: {
      type: 'timestamptz',
      notNull: true,
    },
    ends_at: {
      type: 'timestamptz',
      notNull: true,
    },
    capacity: {
      type: 'integer',
    },
    eligibility_text: {
      type: 'text',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint('events', 'events_category_check', {
    check: "category IN ('TOURNAMENT', 'TRAINING', 'TRIAL', 'MEETUP', 'WORKSHOP', 'OTHER')",
  });

  pgm.addConstraint('events', 'events_status_check', {
    check: "status IN ('DRAFT', 'PUBLISHED', 'CANCELLED')",
  });

  pgm.addConstraint('events', 'events_time_check', {
    check: 'ends_at > starts_at',
  });

  pgm.addConstraint('events', 'events_capacity_check', {
    check: 'capacity IS NULL OR capacity > 0',
  });

  pgm.createIndex('events', ['sport_id']);
  pgm.createIndex('events', ['location_id']);
  pgm.createIndex('events', ['starts_at']);
  pgm.createIndex('events', ['status']);

  pgm.createTable('event_registrations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    event_id: {
      type: 'uuid',
      notNull: true,
      references: 'events(id)',
      onDelete: 'CASCADE',
    },
    player_user_id: {
      type: 'uuid',
      notNull: true,
      references: 'player_profiles(user_id)',
      onDelete: 'CASCADE',
    },
    status: {
      type: 'varchar(16)',
      notNull: true,
      default: 'REGISTERED',
    },
    registered_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint('event_registrations', 'event_registrations_status_check', {
    check: "status IN ('REGISTERED', 'CANCELLED')",
  });

  pgm.addConstraint('event_registrations', 'event_registrations_event_player_unique', {
    unique: ['event_id', 'player_user_id'],
  });

  pgm.createIndex('event_registrations', ['event_id']);
  pgm.createIndex('event_registrations', ['player_user_id']);

  pgm.createTable('training_requests', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    player_user_id: {
      type: 'uuid',
      notNull: true,
      references: 'player_profiles(user_id)',
      onDelete: 'CASCADE',
    },
    coach_user_id: {
      type: 'uuid',
      notNull: true,
      references: 'coach_profiles(user_id)',
      onDelete: 'CASCADE',
    },
    sport_id: {
      type: 'uuid',
      notNull: true,
      references: 'sports(id)',
      onDelete: 'RESTRICT',
    },
    message: {
      type: 'text',
    },
    status: {
      type: 'varchar(16)',
      notNull: true,
      default: 'PENDING',
    },
    requested_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    responded_at: {
      type: 'timestamptz',
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint('training_requests', 'training_requests_status_check', {
    check: "status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')",
  });

  pgm.createIndex('training_requests', ['player_user_id']);
  pgm.createIndex('training_requests', ['coach_user_id']);
  pgm.createIndex('training_requests', ['status']);

  pgm.createIndex(
    'training_requests',
    ['player_user_id', 'coach_user_id', 'sport_id'],
    {
      where: "status = 'PENDING'",
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('training_requests');
  pgm.dropTable('event_registrations');
  pgm.dropTable('events');
};
