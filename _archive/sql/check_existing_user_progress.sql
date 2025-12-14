-- Check all user_progress tables across schemas
SELECT
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables
WHERE tablename = 'user_progress'
ORDER BY schemaname;

-- Check table structures
SELECT
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_progress'
ORDER BY table_schema, ordinal_position;

-- Check if there's data in each table
SELECT
  'public.user_progress' as table_name,
  COUNT(*) as row_count,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM public.user_progress
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_progress')

UNION ALL

SELECT
  'modules.user_progress' as table_name,
  COUNT(*) as row_count,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM modules.user_progress
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'modules' AND table_name = 'user_progress')

UNION ALL

SELECT
  'core.user_progress' as table_name,
  COUNT(*) as row_count,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM core.user_progress
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'user_progress');