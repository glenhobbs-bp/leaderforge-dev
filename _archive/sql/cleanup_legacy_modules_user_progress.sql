-- Cleanup legacy modules.user_progress table
-- This should be executed AFTER creating the core.user_progress table and view

-- First, let's see if there's any data in modules.user_progress that needs to be migrated
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM modules.user_progress;

-- If there's important data, we could migrate it first with:
-- INSERT INTO core.user_progress
-- SELECT * FROM modules.user_progress
-- ON CONFLICT (user_id, content_id, context_key) DO UPDATE SET
--   progress_percentage = EXCLUDED.progress_percentage,
--   last_viewed_at = EXCLUDED.last_viewed_at,
--   -- ... other fields as needed
-- ;

-- After confirming migration (or if no data exists), drop the legacy table
-- UNCOMMENT THE LINES BELOW AFTER CONFIRMING DATA MIGRATION OR NO DATA EXISTS:

-- DROP TABLE IF EXISTS modules.user_progress CASCADE;

-- Also check if the modules schema is now empty and can be dropped
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'modules';

-- If modules schema is empty, you can drop it:
-- DROP SCHEMA IF EXISTS modules CASCADE;