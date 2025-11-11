const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const authRoutes = require('./authRoutes');
const caseRoutes = require('./caseRoutes');

const db = require('./db');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
// Behind Render/Vercel proxies, trust X-Forwarded-* headers for correct protocol/host
app.set('trust proxy', 1);

// Improved CORS configuration: allow localhost in dev and a single production origin
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (no origin), e.g., Postman/cURL
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Increase payload size limit for profile picture uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/cases', caseRoutes);

// Serve React build statically
const buildPath = path.join(__dirname, '..', 'build');
app.use(express.static(buildPath));

// Test route for development
app.get('/', (req, res) => {
  res.json({ 
    message: 'CICL API Server is running', 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// SPA fallback - only serve index.html if build directory exists AND not in development
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (req.method !== 'GET') return next();
  
  // In development, don't serve the React app - let the dev server handle it
  if (process.env.NODE_ENV !== 'production') {
    return res.status(404).json({ 
      message: 'Frontend should be accessed via development server on port 3000',
      path: req.path,
      suggestion: 'Visit http://localhost:3000' + req.path
    });
  }
  
  // Check if build directory exists before trying to serve index.html
  const fs = require('fs');
  const indexPath = path.join(buildPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If no build exists, return 404 for non-API routes
    res.status(404).json({ 
      message: 'Frontend build not found. Run npm run build to create production build.',
      path: req.path 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Verify database connection
db.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected:', res.rows[0]);
  }
});

// Create HTTP server
const server = http.createServer(app);

// Start server
server.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
});

// Ensure base schema exists before enforcing indexes/tables
async function ensureBaseSchema() {
  try {
    const existsRes = await db.query(`
      SELECT 
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') AS has_users,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='cases') AS has_cases
    `);
    const { has_users, has_cases } = existsRes.rows[0] || {};
    if (has_users && has_cases) {
      return; // base tables present
    }
    const fs = require('fs');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.warn('Schema file not found, skipping base schema application:', schemaPath);
      return;
    }
    const sql = fs.readFileSync(schemaPath, 'utf8');
    const client = await db.getClient();
    try {
      await client.query(sql);
      console.log('✅ Applied base schema from schema.sql');
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('❌ Failed to apply base schema:', e.message);
  }
}

// Database index migration: enforce case-insensitive name uniqueness
async function ensureUniqueNameIndex() {
  try {
    // Drop legacy indexes if they exist
    await db.query('DROP INDEX IF EXISTS idx_cases_name_ci');
    await db.query('DROP INDEX IF EXISTS idx_cases_name_unique');
    // Create unique index on case-insensitive names plus birthdate
    await db.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_name_birthdate_unique ON cases (LOWER(first_name), LOWER(last_name), birthdate)');
    console.log('✅ Ensured unique index on name + birthdate');
  } catch (e) {
    console.error('❌ Failed to enforce unique name+birthdate index:', e.message);
  }
}

// Database setup: active_sessions table for single-session enforcement
async function ensureActiveSessionsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS active_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_active_sessions_exp ON active_sessions(expires_at)');
    console.log('✅ Ensured active_sessions table exists');
  } catch (e) {
    console.error('❌ Failed to ensure active_sessions table:', e.message);
  }
}

// Execute migration at startup
ensureBaseSchema().then(() => {
  ensureUniqueNameIndex();
  ensureActiveSessionsTable();
});