-- Backfill legacy program_type values to new standardized categories
-- Maps old "Blessed" program names and variants to: Children, Youth, Sanctuary, Crisis Intervention
-- Safe to re-run; uses CASE mapping and only updates non-null values.

BEGIN;

UPDATE cases
SET program_type = CASE
  WHEN program_type ILIKE '%rosalie%' OR program_type ILIKE '%rendu%' THEN 'Children'
  WHEN program_type ILIKE '%margaret%' OR program_type ILIKE '%rutan%' THEN 'Youth'
  WHEN program_type ILIKE '%martha%' OR program_type ILIKE '%wiecka%' THEN 'Sanctuary'
  WHEN program_type ILIKE '%mother seton%' OR program_type ILIKE '%crisis%' THEN 'Crisis Intervention'
  WHEN program_type ILIKE '%saves%' THEN 'Youth'
  ELSE program_type
END
WHERE program_type IS NOT NULL;

-- Normalize whitespace
UPDATE cases SET program_type = TRIM(program_type) WHERE program_type IS NOT NULL;

COMMIT;