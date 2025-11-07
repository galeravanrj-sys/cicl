const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'auth_system',
  password: 'olddine15',
  port: 5432,
});

async function createMissingTables() {
  try {
    // Check if agencies_persons table exists
    const checkTable = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'agencies_persons'
    `);

    if (checkTable.rows.length === 0) {
      console.log('Creating agencies_persons table...');
      
      await pool.query(`
        CREATE TABLE agencies_persons (
          id SERIAL PRIMARY KEY,
          case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          address_date_duration TEXT,
          services_received TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create index
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_agencies_persons_case_id ON agencies_persons(case_id)
      `);

      console.log('agencies_persons table created successfully');
    } else {
      console.log('agencies_persons table already exists');
    }

    console.log('All tables are ready');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

createMissingTables();