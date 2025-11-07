const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'auth_system',
  password: process.env.DB_PASSWORD || 'olddine15',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Connected to database...');

    const sqlFilePath = path.join(__dirname, 'add_case_descriptions.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Running targeted case descriptions migration...');
    await client.query(sqlContent);
    console.log('Migration completed successfully! Columns ensured on cases table.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();