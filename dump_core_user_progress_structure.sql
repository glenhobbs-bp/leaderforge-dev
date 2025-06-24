-- Dump structure of core.user_progress table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_schema = 'core'
  AND table_name = 'user_progress'
ORDER BY ordinal_position;

-- Dump indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'core'
  AND tablename = 'user_progress';

-- Dump constraints
SELECT
  conname,
  contype,
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'core.user_progress'::regclass;