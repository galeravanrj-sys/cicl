require('dotenv').config();
const db = require('../db');

(async () => {
  try {
    console.log('Starting case name index adjustment...');

    // Find and drop unique constraints specifically on (first_name, last_name)
    const constraintsRes = await db.query(
      "SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'cases'::regclass AND contype = 'u'"
    );
    let droppedAnyConstraint = false;
    for (const row of constraintsRes.rows) {
      const def = row.def || '';
      if (def.includes('first_name') && def.includes('last_name')) {
        console.log(`Dropping unique constraint on name: ${row.conname} => ${def}`);
        await db.query(`ALTER TABLE cases DROP CONSTRAINT ${row.conname}`);
        droppedAnyConstraint = true;
      } else {
        console.log(`Keeping unique constraint: ${row.conname} => ${def}`);
      }
    }
    if (!droppedAnyConstraint) {
      console.log('No unique name constraints found to drop on cases table');
    }

    // Drop legacy unique index if it exists (will succeed only if not tied to a constraint)
    try {
      await db.query('DROP INDEX IF EXISTS idx_cases_name_unique');
      console.log('Dropped legacy unique index if it existed: idx_cases_name_unique');
    } catch (e) {
      console.log('Skipping drop of idx_cases_name_unique:', e.message);
    }

    // Drop legacy non-unique case-insensitive index if present
    try {
      await db.query('DROP INDEX IF EXISTS idx_cases_name_ci');
      console.log('Dropped legacy non-unique index: idx_cases_name_ci');
    } catch (e) {
      console.log('Skipping drop of idx_cases_name_ci:', e.message);
    }

    // Create unique case-insensitive index including birthdate
    await db.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_name_birthdate_unique ON cases (LOWER(first_name), LOWER(last_name), birthdate)');
    console.log('Ensured unique index on case-insensitive name + birthdate: idx_cases_name_birthdate_unique');

    // Show current indexes for verification
    const idxRes = await db.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename='cases' ORDER BY indexname");
    console.log('Current indexes on cases table:');
    idxRes.rows.forEach(r => console.log(`${r.indexname}: ${r.indexdef}`));

    console.log('Case name index adjustment completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to adjust case name indexes:', err);
    process.exit(1);
  }
})();