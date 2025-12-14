-- Migration: 018_ai_transcripts_placeholder
-- Description: Transcript storage for future AI features
-- Date: 2024-12-14
-- Note: pgvector extension needed for embeddings - add when implementing Phase 2

CREATE TABLE content.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content.items(id) ON DELETE CASCADE,
  
  -- Transcript data
  full_text TEXT,
  word_count INTEGER,
  language TEXT DEFAULT 'en',
  source TEXT CHECK (source IN ('whisper', 'tribe', 'manual', 'auto')),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'error')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (content_id)
);

CREATE INDEX idx_transcripts_content ON content.transcripts(content_id);
CREATE INDEX idx_transcripts_status ON content.transcripts(status);

-- Full-text search index
CREATE INDEX idx_transcripts_search ON content.transcripts 
  USING GIN(to_tsvector('english', coalesce(full_text, '')));

-- Transcript chunks (for timestamps and future embeddings)
CREATE TABLE content.transcript_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID NOT NULL REFERENCES content.transcripts(id) ON DELETE CASCADE,
  
  -- Chunk data
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  start_time_seconds DECIMAL(10, 2),
  end_time_seconds DECIMAL(10, 2),
  
  -- Future: embedding VECTOR(1536) - add when pgvector is enabled
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chunks_transcript ON content.transcript_chunks(transcript_id);
CREATE INDEX idx_chunks_time ON content.transcript_chunks(start_time_seconds);
CREATE INDEX idx_chunks_search ON content.transcript_chunks 
  USING GIN(to_tsvector('english', text));

-- RLS
ALTER TABLE content.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.transcript_chunks ENABLE ROW LEVEL SECURITY;

-- Inherit content access for transcripts
CREATE POLICY "transcripts_content_access" ON content.transcripts FOR SELECT USING (
  content_id IN (SELECT id FROM content.items)
);
CREATE POLICY "transcripts_service_role" ON content.transcripts FOR ALL TO service_role USING (true);

CREATE POLICY "chunks_transcript_access" ON content.transcript_chunks FOR SELECT USING (
  transcript_id IN (SELECT id FROM content.transcripts)
);
CREATE POLICY "chunks_service_role" ON content.transcript_chunks FOR ALL TO service_role USING (true);

GRANT SELECT ON content.transcripts TO authenticated;
GRANT SELECT ON content.transcript_chunks TO authenticated;
GRANT ALL ON content.transcripts TO service_role;
GRANT ALL ON content.transcript_chunks TO service_role;

COMMENT ON TABLE content.transcripts IS 'Video transcripts for search and AI features';
COMMENT ON TABLE content.transcript_chunks IS 'Transcript segments with timestamps for jump-to feature';

