const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration (PostgreSQL)
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'auth_system',
  password: process.env.DB_PASSWORD || 'olddine15',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function getCounts(client) {
  const queries = {
    legacy_rosalie: `SELECT COUNT(*) FROM cases WHERE program_type ILIKE '%rosalie%' OR program_type ILIKE '%rendu%'`,
    legacy_margaret: `SELECT COUNT(*) FROM cases WHERE program_type ILIKE '%margaret%' OR program_type ILIKE '%rutan%'`,
    legacy_martha: `SELECT COUNT(*) FROM cases WHERE program_type ILIKE '%martha%' OR program_type ILIKE '%wiecka%'`,
    legacy_seton_crisis: `SELECT COUNT(*) FROM cases WHERE program_type ILIKE '%mother seton%' OR program_type ILIKE '%crisis%'`,
    legacy_saves: `SELECT COUNT(*) FROM cases WHERE program_type ILIKE '%saves%'`,
    new_children: `SELECT COUNT(*) FROM cases WHERE program_type = 'Children'`,
    new_youth: `SELECT COUNT(*) FROM cases WHERE program_type = 'Youth'`,
    new_sanctuary: `SELECT COUNT(*) FROM cases WHERE program_type = 'Sanctuary'`,
    new_crisis: `SELECT COUNT(*) FROM cases WHERE program_type = 'Crisis Intervention'`,
    total: `SELECT COUNT(*) FROM cases`
  };

  const results = {};
  for (const [key, sql] of Object.entries(queries)) {
    const res = await client.query(sql);
    results[key] = parseInt(res.rows[0].count, 10);
  }
  return results;
}

async function runBackfill() {
  const client = await pool.connect();

  try {
    console.log('Connected to database...');

    // Show counts before backfill
    const before = await getCounts(client);
    console.log('Before backfill:');
    console.table({
      legacy_rosalie: before.legacy_rosalie,
      legacy_margaret: before.legacy_margaret,
      legacy_martha: before.legacy_martha,
      legacy_seton_crisis: before.legacy_seton_crisis,
      legacy_saves: before.legacy_saves,
      new_children: before.new_children,
      new_youth: before.new_youth,
      new_sanctuary: before.new_sanctuary,
      new_crisis: before.new_crisis,
      total: before.total
    });

    // Read SQL backfill file
    const sqlFilePath = path.join(__dirname, 'backfill_program_types.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Applying program_type backfill...');
    const result = await client.query(sqlContent);
    console.log(`Backfill applied. Rows affected (last statement): ${result.rowCount ?? 'unknown'}`);

    // Show counts after backfill
    const after = await getCounts(client);
    console.log('After backfill:');
    console.table({
      new_children: after.new_children,
      new_youth: after.new_youth,
      new_sanctuary: after.new_sanctuary,
      new_crisis: after.new_crisis,
      total: after.total
    });

    console.log('✅ Program type backfill complete.');
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runBackfill();