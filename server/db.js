const { Pool } = require('pg');
require('dotenv').config();

const useSsl = () => {
  const requireSsl = process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production';
  return requireSsl ? { rejectUnauthorized: false } : false;
};

// Helpful: show which env keys exist (names only, never values)
const present = (keys) => keys.filter((k) => process.env[k]);
const absent = (keys) => keys.filter((k) => !process.env[k]);
const logEnvPresence = () => {
  const keys = ['DATABASE_URL', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_PORT', 'PGSSLMODE', 'PGPASSWORD'];
  const p = present(keys);
  const a = absent(keys);
  console.info('[DB ENV] present:', p.join(', ') || 'none', '| absent:', a.join(', ') || 'none');
};
if (process.env.NODE_ENV === 'production') logEnvPresence();

const hostLooksLikeUrl = (s) => typeof s === 'string' && /:\/\//.test(s);

let pool;
if (process.env.DATABASE_URL || process.env.DB_URL || hostLooksLikeUrl(process.env.DB_HOST)) {
  const connectionString = process.env.DATABASE_URL || process.env.DB_URL || process.env.DB_HOST;
  if (hostLooksLikeUrl(process.env.DB_HOST) && !process.env.DATABASE_URL && !process.env.DB_URL) {
    console.warn('[DB CONFIG] Detected full connection string in DB_HOST; using it as connectionString. Consider moving it to DATABASE_URL.');
  }
  pool = new Pool({
    connectionString,
    ssl: useSsl(),
  });
} else {
  // Support PGPASSWORD as alternative to DB_PASSWORD
  const requiredVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PORT'];
  const missing = requiredVars.filter((k) => !process.env[k]);
  const password = process.env.DB_PASSWORD || process.env.PGPASSWORD;
  if (missing.length || !password) {
    const missingList = missing.slice();
    if (!password) missingList.push('DB_PASSWORD (or PGPASSWORD)');
    throw new Error(`Missing required DB env vars: ${missingList.join(', ')}`);
  }
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password,
    port: parseInt(process.env.DB_PORT, 10),
    ssl: useSsl(),
  });
}

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};