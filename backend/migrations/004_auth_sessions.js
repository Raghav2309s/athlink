exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('auth_sessions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },

    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },

    token_hash: {
      type: 'varchar(64)',
      notNull: true,
      unique: true,
    },

    expires_at: {
      type: 'timestamptz',
      notNull: true,
    },

    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },

    last_seen_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('auth_sessions', ['user_id']);
  pgm.createIndex('auth_sessions', ['expires_at']);
};

exports.down = (pgm) => {
  pgm.dropTable('auth_sessions');
};