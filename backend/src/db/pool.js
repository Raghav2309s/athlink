'use strict';

const { Pool } = require('pg');
const { env } = require('../config/env');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function checkDatabaseConnection() {
  const result = await pool.query('SELECT NOW() AS now');
  return result.rows[0];
}

async function closeDatabase() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  checkDatabaseConnection,
  closeDatabase,
};