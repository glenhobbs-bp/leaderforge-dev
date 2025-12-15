-- Migration: 021_manual_unlock_mode
-- Description: Add manual unlock mode for admin-controlled content release
-- Date: 2024-12-15

-- =============================================================================
-- UPDATE UNLOCK MODE CHECK CONSTRAINT
-- =============================================================================
-- Add 'manual' as a valid unlock mode option

ALTER TABLE content.learning_paths 
  DROP CONSTRAINT IF EXISTS learning_paths_unlock_mode_check;

ALTER TABLE content.learning_paths 
  ADD CONSTRAINT learning_paths_unlock_mode_check 
  CHECK (unlock_mode IN ('time_based', 'completion_based', 'hybrid', 'manual'));

-- Update comment
COMMENT ON COLUMN content.learning_paths.unlock_mode IS 
  'How content unlocks: time_based (cohort), completion_based (self-paced), hybrid (both), or manual (admin controlled)';

-- =============================================================================
-- ADD MANUAL UNLOCK FIELD TO LEARNING PATH ITEMS
-- =============================================================================
-- For manual mode, admin explicitly unlocks each item

ALTER TABLE content.learning_path_items 
  ADD COLUMN IF NOT EXISTS is_manually_unlocked BOOLEAN DEFAULT false;

ALTER TABLE content.learning_path_items
  ADD COLUMN IF NOT EXISTS manually_unlocked_at TIMESTAMPTZ;

ALTER TABLE content.learning_path_items
  ADD COLUMN IF NOT EXISTS manually_unlocked_by UUID REFERENCES auth.users(id);

-- Index for efficient manual unlock queries
CREATE INDEX IF NOT EXISTS idx_learning_path_items_manual_unlock 
  ON content.learning_path_items(learning_path_id, is_manually_unlocked) 
  WHERE is_manually_unlocked = true;

-- Comments
COMMENT ON COLUMN content.learning_path_items.is_manually_unlocked IS 
  'For manual unlock mode: true if admin has unlocked this item';
COMMENT ON COLUMN content.learning_path_items.manually_unlocked_at IS 
  'Timestamp when admin manually unlocked this item';
COMMENT ON COLUMN content.learning_path_items.manually_unlocked_by IS 
  'Admin user who manually unlocked this item';
