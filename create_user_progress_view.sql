-- Create a view in public schema that points to core.user_progress
-- This allows the Supabase client to access the table without schema qualification

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.user_progress;

-- Create view pointing to core.user_progress
CREATE VIEW public.user_progress AS
SELECT * FROM core.user_progress;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO service_role;

-- Enable RLS on the view (inherits from core table)
ALTER VIEW public.user_progress OWNER TO postgres;

-- Optional: Create trigger to handle inserts/updates through the view
-- (This allows the view to be fully writable)
CREATE OR REPLACE FUNCTION public.user_progress_instead_of_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO core.user_progress VALUES (NEW.*);
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
      updated_at = NEW.updated_at
    WHERE id = OLD.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM core.user_progress WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the instead-of trigger
CREATE TRIGGER user_progress_instead_of_trigger
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.user_progress_instead_of_trigger();