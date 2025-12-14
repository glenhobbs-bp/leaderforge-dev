-- Simple solution: Create public.user_progress view pointing to core.user_progress
-- Since modules.user_progress is dropped, this should work cleanly

-- Drop any existing view first (in case it exists)
DROP VIEW IF EXISTS public.user_progress CASCADE;

-- Create view pointing to core.user_progress
CREATE VIEW public.user_progress AS
SELECT
  id,
  user_id,
  content_id,
  context_key,
  progress_type,
  progress_percentage,
  completion_count,
  total_sessions,
  started_at,
  last_viewed_at,
  completed_at,
  notes,
  metadata,
  sync_status,
  last_synced_at,
  created_at,
  updated_at
FROM core.user_progress;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Create function to handle inserts/updates/deletes through the view
CREATE OR REPLACE FUNCTION public.user_progress_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO core.user_progress (
      user_id, content_id, context_key, progress_type, progress_percentage,
      completion_count, total_sessions, started_at, last_viewed_at, completed_at,
      notes, metadata, sync_status, last_synced_at
    ) VALUES (
      NEW.user_id, NEW.content_id, NEW.context_key, NEW.progress_type, NEW.progress_percentage,
      NEW.completion_count, NEW.total_sessions, NEW.started_at, NEW.last_viewed_at, NEW.completed_at,
      NEW.notes, NEW.metadata, NEW.sync_status, NEW.last_synced_at
    ) RETURNING * INTO NEW;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE core.user_progress
    SET
      progress_type = NEW.progress_type,
      progress_percentage = NEW.progress_percentage,
      completion_count = NEW.completion_count,
      total_sessions = NEW.total_sessions,
      started_at = NEW.started_at,
      last_viewed_at = NEW.last_viewed_at,
      completed_at = NEW.completed_at,
      notes = NEW.notes,
      metadata = NEW.metadata,
      sync_status = NEW.sync_status,
      last_synced_at = NEW.last_synced_at,
      updated_at = NOW()
    WHERE id = OLD.id
    RETURNING * INTO NEW;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM core.user_progress WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create INSTEAD OF trigger for the view
CREATE TRIGGER user_progress_instead_of_trigger
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.user_progress_trigger();

-- Verify the setup
SELECT 'View created successfully!' as status;