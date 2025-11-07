#!/usr/bin/env node
const db = require('../db');

function getArg(name) {
  const idx = process.argv.findIndex(a => a === `--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  const kv = process.argv.find(a => a.startsWith(`--${name}=`));
  if (kv) return kv.split('=')[1];
  return null;
}

(async () => {
  const email = getArg('email');
  const role = getArg('role') || 'admin';
  if (!email) {
    console.error('Usage: node server/scripts/promoteUserToAdmin.js --email user@example.com [--role admin]');
    process.exit(1);
  }

  try {
    // Show current role first (if exists)
    const before = await db.query('SELECT id, email, role FROM users WHERE email = $1', [email]);
    if (before.rowCount === 0) {
      console.error(`No user found with email: ${email}`);
      process.exit(2);
    }
    console.log(`Current role for ${email}: ${before.rows[0].role || '(none)'}`);

    const res = await db.query('UPDATE users SET role = $1 WHERE email = $2 RETURNING id, email, role', [role, email]);
    if (res.rowCount === 0) {
      console.error(`Update failed: no rows affected for email ${email}`);
      process.exit(3);
    }
    console.log(`Updated user ${res.rows[0].email} (id=${res.rows[0].id}) to role: ${res.rows[0].role}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to update role:', err.message || err);
    process.exit(4);
  }
})();