const { Pool } = require('pg');
require('dotenv').config();

// Strict env-only configuration: require all DB_* vars
const requiredVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
const missing = requiredVars.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(`Missing required DB env vars: ${missing.join(', ')}`);
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10),
});

// Optional: Log connection errors more clearly
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};