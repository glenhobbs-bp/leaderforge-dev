-- Migration: 012_progress
-- Description: Create user progress tracking table
-- Date: 2024-12-14

CREATE TABLE progress.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content.items(id) ON DELETE CASCADE,
  
  -- Progress type (matches content type)
  progress_type TEXT NOT NULL DEFAULT 'video'
    CHECK (progress_type IN ('video', 'document', 'quiz', 'course', 'custom')),
  
  -- Progress data
  progress_percentage INTEGER DEFAULT 0
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completion_count INTEGER DEFAULT 0,  -- Times completed
  total_sessions INTEGER DEFAULT 0,    -- Number of viewing sessions
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Type-specific metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  /*
    video: {
      watch_time_seconds: 0,
      last_position_seconds: 0,
      playback_rate: 1.0,
      segments_watched: [[0, 30], [45, 120]]
    }
    document: {
      pages_viewed: [1, 2, 3],
      scroll_position: 0.5,
      time_spent_seconds: 0
    }
    quiz: {
      score: 85,
      answers: {...},
      attempts: 1
    }
    course: {
      modules_completed: ['mod-1', 'mod-2'],
      current_module: 'mod-3'
    }
  */
  
  -- Optional user notes
  notes TEXT,
  bookmarked BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One progress record per user/content
  UNIQUE (user_id, content_id, tenant_id)
);

-- Indexes
CREATE INDEX idx_progress_user ON progress.user_progress(user_id);
CREATE INDEX idx_progress_content ON progress.user_progress(content_id);
CREATE INDEX idx_progress_tenant ON progress.user_progress(tenant_id);
CREATE INDEX idx_progress_type ON progress.user_progress(progress_type);
CREATE INDEX idx_progress_completed ON progress.user_progress(completed_at) 
  WHERE completed_at IS NOT NULL;
CREATE INDEX idx_progress_last_viewed ON progress.user_progress(last_viewed_at DESC);
CREATE INDEX idx_progress_bookmarked ON progress.user_progress(bookmarked) 
  WHERE bookmarked = true;
CREATE INDEX idx_progress_metadata ON progress.user_progress USING GIN(metadata);

-- Comments
COMMENT ON TABLE progress.user_progress IS 'Universal progress tracking for all content types';
COMMENT ON COLUMN progress.user_progress.progress_type IS 'Content type for this progress record';
COMMENT ON COLUMN progress.user_progress.metadata IS 'Type-specific progress data (position, score, etc.)';
COMMENT ON COLUMN progress.user_progress.completion_count IS 'Number of times content was completed';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON progress.user_progress TO authenticated;
GRANT ALL ON progress.user_progress TO service_role;

