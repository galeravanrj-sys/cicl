const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration (support connection string and discrete vars)
const hostLooksLikeUrl = (s) => typeof s === 'string' && /:\/\//.test(s);
let pool;
if (process.env.DATABASE_URL || process.env.DB_URL || hostLooksLikeUrl(process.env.DB_HOST)) {
  const connectionString = process.env.DATABASE_URL || process.env.DB_URL || process.env.DB_HOST;
  pool = new Pool({ connectionString });
} else {
  const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'olddine15';
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'auth_system',
    password,
    port: parseInt(process.env.DB_PORT || '5432', 10),
  });
}

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database...');
    
    // Read the consolidated schema file
    const sqlFilePath = path.join(__dirname, 'schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Applying consolidated schema...');
    
    // Execute the SQL
    await client.query(sqlContent);
    
    console.log('Schema applied successfully!');
    console.log('All tables, columns, indexes, and triggers are now in place.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration();