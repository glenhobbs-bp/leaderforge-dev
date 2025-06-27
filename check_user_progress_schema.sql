-- SQL script to check user_progress table schema
-- Run this in your Supabase SQL editor or via psql

-- Check if core.user_progress table exists and get its structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  'core.user_progress' as table_source
FROM information_schema.columns
WHERE table_schema = 'core'
AND table_name = 'user_progress'
ORDER BY ordinal_position;

-- Check if public.user_progress table exists
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  'public.user_progress' as table_source
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_progress'
ORDER BY ordinal_position;

-- Check if public.user_video_progress table exists
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  'public.user_video_progress' as table_source
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_video_progress'
ORDER BY ordinal_position;

-- Sample data from core.user_progress to see actual structure
SELECT * FROM core.user_progress LIMIT 3;