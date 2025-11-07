const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'auth_system',
  password: process.env.DB_PASSWORD || 'olddine15',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function checkDates() {
  try {
    // Check sample cases with dates
    const sampleResult = await pool.query(`
      SELECT id, first_name, last_name, created_at, last_updated 
      FROM cases 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('Sample cases with dates:');
    console.log('ID | Name | Created At | Last Updated');
    console.log('---|------|------------|-------------');
    sampleResult.rows.forEach(row => {
      console.log(`${row.id} | ${row.first_name} ${row.last_name} | ${row.created_at} | ${row.last_updated}`);
    });
    
    // Check cases by creation date
    const dateResult = await pool.query(`
      SELECT COUNT(*) as total, DATE(created_at) as date 
      FROM cases 
      GROUP BY DATE(created_at) 
      ORDER BY date DESC 
      LIMIT 10
    `);
    
    console.log('\nCases by creation date:');
    console.log('Date | Count');
    console.log('-----|------');
    dateResult.rows.forEach(row => {
      console.log(`${row.date} | ${row.total}`);
    });
    
    // Check month distribution
    const monthResult = await pool.query(`
      SELECT 
        EXTRACT(YEAR FROM created_at) as year,
        EXTRACT(MONTH FROM created_at) as month,
        COUNT(*) as total 
      FROM cases 
      GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
      ORDER BY year DESC, month DESC
    `);
    
    console.log('\nCases by month:');
    console.log('Year-Month | Count');
    console.log('-----------|------');
    monthResult.rows.forEach(row => {
      console.log(`${row.year}-${String(row.month).padStart(2, '0')} | ${row.total}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkDates();