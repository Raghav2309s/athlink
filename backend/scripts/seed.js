'use strict';

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const { query, closeDatabase } = require('../src/db/pool');

const DATA_DIR = path.join(__dirname, '..', 'database', 'seeds', 'data');
const DEMO_DIR = path.join(DATA_DIR, 'demo');

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').trim();

  const lines = text.split(/\r?\n/);
  const headers = lines.shift().split(',');

  return lines
    .filter(Boolean)
    .map((line) => {
      const values = line.split(',');

      return Object.fromEntries(
        headers.map((header, index) => [
          header.trim(),
          (values[index] || '').trim(),
        ])
      );
    });
}

async function seedSports() {
  const rows = readCsv(path.join(DATA_DIR, 'sports.csv'));

  for (const row of rows) {
    await query(
      `
        INSERT INTO sports (name)
        VALUES ($1)
        ON CONFLICT (name)
        DO UPDATE SET is_active = true
      `,
      [row.name]
    );
  }

  console.log(`Seeded ${rows.length} sports`);
}

async function seedLocalities() {
  const rows = readCsv(path.join(DATA_DIR, 'localities.csv'));

  for (const row of rows) {
    await query(
      `
        INSERT INTO localities (
          name,
          city,
          state,
          country
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name)
        DO UPDATE SET
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          country = EXCLUDED.country
      `,
      [
        row.name,
        row.city,
        row.state,
        row.country,
      ]
    );
  }

  console.log(`Seeded ${rows.length} localities`);
}

async function seedUsers() {
  const rows = readCsv(path.join(DEMO_DIR, 'users.csv'));

  const demoPassword =
    process.env.DEMO_PASSWORD || 'AthlinkDemo123!';

  const passwordHash = await bcrypt.hash(
    demoPassword,
    Number(process.env.BCRYPT_COST || 12)
  );

  for (const row of rows) {
    await query(
      `
        INSERT INTO users (
          email,
          password_hash,
          role
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (email)
        DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          is_active = true
      `,
      [
        row.email.toLowerCase(),
        passwordHash,
        row.role,
      ]
    );
  }

  console.log(`Seeded ${rows.length} demo users`);
}

async function main() {
  try {
    console.log('Starting ATHLINK seed...');

    await seedSports();
    await seedLocalities();
    await seedUsers();

    console.log('ATHLINK seed completed successfully.');
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

main();