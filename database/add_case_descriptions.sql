-- Targeted migration to add brief description columns to cases
-- Safe to re-run due to IF NOT EXISTS guards

ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_description TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS parents_description TEXT;

COMMENT ON COLUMN cases.client_description IS 'Brief description of the client upon intake';
COMMENT ON COLUMN cases.parents_description IS 'Brief description of the parents/relatives/guardian upon intake';

COMMIT;