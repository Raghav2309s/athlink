exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('player_profiles', {
    user_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    full_name: {
      type: 'varchar(160)',
      notNull: true,
    },
    date_of_birth: {
      type: 'date',
    },
    bio: {
      type: 'text',
    },
    experience_level: {
      type: 'varchar(32)',
    },
    university: {
      type: 'varchar(200)',
    },
    location_id: {
      type: 'uuid',
      references: 'locations(id)',
      onDelete: 'SET NULL',
    },
    is_verified: {
      type: 'boolean',
      notNull: true,
      default: false,
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

  pgm.addConstraint(
    'player_profiles',
    'player_profiles_experience_level_check',
    {
      check: "experience_level IS NULL OR experience_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL')",
    }
  );

  pgm.createTable('player_sports', {
    player_user_id: {
      type: 'uuid',
      notNull: true,
      references: 'player_profiles(user_id)',
      onDelete: 'CASCADE',
    },
    sport_id: {
      type: 'uuid',
      notNull: true,
      references: 'sports(id)',
      onDelete: 'RESTRICT',
    },
    is_primary: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    years_experience: {
      type: 'numeric(4,1)',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint(
    'player_sports',
    'player_sports_pkey',
    {
      primaryKey: ['player_user_id', 'sport_id'],
    }
  );

  pgm.createTable('coach_profiles', {
    user_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    full_name: {
      type: 'varchar(160)',
      notNull: true,
    },
    bio: {
      type: 'text',
    },
    experience_years: {
      type: 'numeric(4,1)',
    },
    certification: {
      type: 'varchar(200)',
    },
    academy_name: {
      type: 'varchar(200)',
    },
    rating: {
      type: 'numeric(3,2)',
    },
    location_id: {
      type: 'uuid',
      references: 'locations(id)',
      onDelete: 'SET NULL',
    },
    is_verified: {
      type: 'boolean',
      notNull: true,
      default: false,
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

  pgm.createIndex('coach_profiles', ['location_id']);
  pgm.createIndex('coach_profiles', ['rating']);

  pgm.createTable('coach_sports', {
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
    is_primary: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
  });

  pgm.addConstraint(
    'coach_sports',
    'coach_sports_pkey',
    {
      primaryKey: ['coach_user_id', 'sport_id'],
    }
  );

  pgm.createTable('facilities', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(200)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    location_id: {
      type: 'uuid',
      references: 'locations(id)',
      onDelete: 'SET NULL',
    },
    facility_type: {
      type: 'varchar(64)',
    },
    is_verified: {
      type: 'boolean',
      notNull: true,
      default: false,
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

  pgm.createIndex('facilities', ['location_id']);

  pgm.createTable('facility_sports', {
    facility_id: {
      type: 'uuid',
      notNull: true,
      references: 'facilities(id)',
      onDelete: 'CASCADE',
    },
    sport_id: {
      type: 'uuid',
      notNull: true,
      references: 'sports(id)',
      onDelete: 'RESTRICT',
    },
  });

  pgm.addConstraint(
    'facility_sports',
    'facility_sports_pkey',
    {
      primaryKey: ['facility_id', 'sport_id'],
    }
  );

  pgm.createTable('academies', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(200)',
      notNull: true,
      unique: true,
    },
    description: {
      type: 'text',
    },
    website_url: {
      type: 'text',
    },
    phone: {
      type: 'varchar(32)',
    },
    is_verified: {
      type: 'boolean',
      notNull: true,
      default: false,
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

  pgm.createTable('academy_centers', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    academy_id: {
      type: 'uuid',
      notNull: true,
      references: 'academies(id)',
      onDelete: 'CASCADE',
    },
    facility_id: {
      type: 'uuid',
      references: 'facilities(id)',
      onDelete: 'SET NULL',
    },
    hosted_at_facility_id: {
      type: 'uuid',
      references: 'facilities(id)',
      onDelete: 'SET NULL',
    },
    location_id: {
      type: 'uuid',
      references: 'locations(id)',
      onDelete: 'SET NULL',
    },
    name: {
      type: 'varchar(200)',
      notNull: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('academy_centers', ['academy_id']);
  pgm.createIndex('academy_centers', ['location_id']);

  pgm.createTable('academy_center_sports', {
    academy_center_id: {
      type: 'uuid',
      notNull: true,
      references: 'academy_centers(id)',
      onDelete: 'CASCADE',
    },
    sport_id: {
      type: 'uuid',
      notNull: true,
      references: 'sports(id)',
      onDelete: 'RESTRICT',
    },
  });

  pgm.addConstraint(
    'academy_center_sports',
    'academy_center_sports_pkey',
    {
      primaryKey: ['academy_center_id', 'sport_id'],
    }
  );

  pgm.createTable('organizations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(200)',
      notNull: true,
      unique: true,
    },
    type: {
      type: 'varchar(32)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    contact_email: {
      type: 'varchar(320)',
    },
    contact_phone: {
      type: 'varchar(32)',
    },
    website_url: {
      type: 'text',
    },
    location_id: {
      type: 'uuid',
      references: 'locations(id)',
      onDelete: 'SET NULL',
    },
    is_verified: {
      type: 'boolean',
      notNull: true,
      default: false,
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

  pgm.addConstraint(
    'organizations',
    'organizations_type_check',
    {
      check: "type IN ('GOVERNMENT', 'PRIVATE', 'UNIVERSITY', 'CLUB', 'ASSOCIATION')",
    }
  );

  pgm.createIndex('organizations', ['location_id']);
};

exports.down = (pgm) => {
  pgm.dropTable('academy_center_sports');
  pgm.dropTable('academy_centers');
  pgm.dropTable('academies');
  pgm.dropTable('facility_sports');
  pgm.dropTable('facilities');
  pgm.dropTable('coach_sports');
  pgm.dropTable('coach_profiles');
  pgm.dropTable('player_sports');
  pgm.dropTable('player_profiles');
  pgm.dropTable('organizations');
};
