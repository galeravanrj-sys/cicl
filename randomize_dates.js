const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'auth_system',
  password: process.env.DB_PASSWORD || 'olddine15',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Function to generate random date within a range
function getRandomDate(startDate, endDate) {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime);
}

// Function to generate random time within a day
function getRandomTime() {
  const hours = Math.floor(Math.random() * 24);
  const minutes = Math.floor(Math.random() * 60);
  const seconds = Math.floor(Math.random() * 60);
  return { hours, minutes, seconds };
}

async function randomizeDates() {
  try {
    console.log('Starting date randomization...');
    
    // Get all cases
    const casesResult = await pool.query('SELECT id FROM cases ORDER BY id');
    const cases = casesResult.rows;
    
    console.log(`Found ${cases.length} cases to update`);
    
    // Define date ranges (last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    // Create month buckets with different weights
    const monthBuckets = [
      { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now, weight: 0.25 }, // Current month - 25%
      { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0), weight: 0.20 }, // Last month - 20%
      { start: new Date(now.getFullYear(), now.getMonth() - 2, 1), end: new Date(now.getFullYear(), now.getMonth() - 1, 0), weight: 0.15 }, // 2 months ago - 15%
      { start: new Date(now.getFullYear(), now.getMonth() - 3, 1), end: new Date(now.getFullYear(), now.getMonth() - 2, 0), weight: 0.15 }, // 3 months ago - 15%
      { start: new Date(now.getFullYear(), now.getMonth() - 4, 1), end: new Date(now.getFullYear(), now.getMonth() - 3, 0), weight: 0.15 }, // 4 months ago - 15%
      { start: new Date(now.getFullYear(), now.getMonth() - 5, 1), end: new Date(now.getFullYear(), now.getMonth() - 4, 0), weight: 0.10 }, // 5 months ago - 10%
    ];
    
    // Distribute cases across months based on weights
    let caseIndex = 0;
    
    for (const bucket of monthBuckets) {
      const casesInThisBucket = Math.floor(cases.length * bucket.weight);
      console.log(`Assigning ${casesInThisBucket} cases to ${bucket.start.toLocaleDateString()} - ${bucket.end.toLocaleDateString()}`);
      
      for (let i = 0; i < casesInThisBucket && caseIndex < cases.length; i++) {
        const caseId = cases[caseIndex].id;
        const randomDate = getRandomDate(bucket.start, bucket.end);
        const randomTime = getRandomTime();
        
        // Set random time
        randomDate.setHours(randomTime.hours, randomTime.minutes, randomTime.seconds);
        
        // Update both created_at and last_updated
        await pool.query(
          'UPDATE cases SET created_at = $1, last_updated = $2 WHERE id = $3',
          [randomDate, randomDate.toISOString().split('T')[0], caseId]
        );
        
        caseIndex++;
      }
    }
    
    // Handle any remaining cases (assign to random months)
    while (caseIndex < cases.length) {
      const caseId = cases[caseIndex].id;
      const randomBucket = monthBuckets[Math.floor(Math.random() * monthBuckets.length)];
      const randomDate = getRandomDate(randomBucket.start, randomBucket.end);
      const randomTime = getRandomTime();
      
      randomDate.setHours(randomTime.hours, randomTime.minutes, randomTime.seconds);
      
      await pool.query(
        'UPDATE cases SET created_at = $1, last_updated = $2 WHERE id = $3',
        [randomDate, randomDate.toISOString().split('T')[0], caseId]
      );
      
      caseIndex++;
    }
    
    console.log('Date randomization completed!');
    
    // Show updated distribution
    const monthResult = await pool.query(`
      SELECT 
        EXTRACT(YEAR FROM created_at) as year,
        EXTRACT(MONTH FROM created_at) as month,
        COUNT(*) as total 
      FROM cases 
      GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
      ORDER BY year DESC, month DESC
    `);
    
    console.log('\nUpdated cases by month:');
    console.log('Year-Month | Count');
    console.log('-----------|------');
    monthResult.rows.forEach(row => {
      const monthName = new Date(row.year, row.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      console.log(`${monthName} | ${row.total}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

randomizeDates();