exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'varchar(320)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'text',
      notNull: true,
    },
    role: {
      type: 'varchar(32)',
      notNull: true,
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    token_version: {
      type: 'integer',
      notNull: true,
      default: 0,
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
    'users',
    'users_role_check',
    {
      check: "role IN ('PLAYER', 'COACH', 'ORGANIZATION', 'ADMIN')",
    }
  );

  pgm.createTable('localities', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(120)',
      notNull: true,
      unique: true,
    },
    city: {
      type: 'varchar(120)',
      notNull: true,
    },
    state: {
      type: 'varchar(120)',
      notNull: true,
    },
    country: {
      type: 'varchar(120)',
      notNull: true,
      default: 'India',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createTable('locations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    locality_id: {
      type: 'uuid',
      references: 'localities(id)',
      onDelete: 'SET NULL',
    },
    latitude: {
      type: 'double precision',
    },
    longitude: {
      type: 'double precision',
    },
    coord_origin: {
      type: 'varchar(32)',
    },
    coord_precision: {
      type: 'varchar(32)',
    },
    address_text: {
      type: 'text',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('locations', ['latitude', 'longitude']);

  pgm.createTable('sports', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(100)',
      notNull: true,
      unique: true,
    },
    description: {
      type: 'text',
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createTable('sport_aliases', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    sport_id: {
      type: 'uuid',
      notNull: true,
      references: 'sports(id)',
      onDelete: 'CASCADE',
    },
    alias: {
      type: 'varchar(100)',
      notNull: true,
    },
  });

  pgm.createIndex(
    'sport_aliases',
    ['sport_id', 'alias'],
    { unique: true }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('sport_aliases');
  pgm.dropTable('sports');
  pgm.dropTable('locations');
  pgm.dropTable('localities');
  pgm.dropTable('users');
};
