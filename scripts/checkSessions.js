const db = require('../server/db');

async function run(userId) {
  try {
    const res = await db.query(
      'SELECT user_id, token, created_at, expires_at FROM active_sessions WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );
    const rows = res.rows.map(r => ({
      user_id: r.user_id,
      token_prefix: r.token.substring(0, 16) + '...',
      created_at: r.created_at,
      expires_at: r.expires_at,
    }));
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('Query error:', e.message);
  } finally {
    process.exit(0);
  }
}

const userId = parseInt(process.argv[2], 10);
if (!userId) {
  console.error('Usage: node scripts/checkSessions.js <userId>');
  process.exit(1);
}
run(userId);