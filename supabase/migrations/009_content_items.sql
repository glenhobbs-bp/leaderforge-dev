-- Migration: 009_content_items
-- Description: Create content items table
-- Date: 2024-12-14

CREATE TABLE content.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  
  -- Ownership (for marketplace - Phase 2/3)
  -- MVP: owner_type always 'platform', owner_tenant_id always NULL
  owner_type TEXT NOT NULL DEFAULT 'platform'
    CHECK (owner_type IN ('platform', 'tenant')),
  owner_tenant_id UUID REFERENCES core.tenants(id),
  
  -- Content type
  type TEXT NOT NULL CHECK (type IN ('video', 'document', 'link', 'course')),
  
  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  content_url TEXT,
  duration_seconds INTEGER,  -- For videos
  
  -- Extended metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  /*
    Common metadata fields:
    - video: { provider, video_id, captions_url }
    - document: { page_count, file_size, file_type }
    - link: { external_url }
    - course: { module_count, estimated_hours }
  */
  tags TEXT[] DEFAULT '{}',
  
  -- Marketplace (Phase 3)
  -- MVP: visibility always 'private'
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'licensable')),
  
  -- Sort/display
  sort_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT owner_tenant_required 
    CHECK (owner_type = 'platform' OR owner_tenant_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_content_tenant ON content.items(tenant_id);
CREATE INDEX idx_content_type ON content.items(type);
CREATE INDEX idx_content_owner ON content.items(owner_type, owner_tenant_id);
CREATE INDEX idx_content_tags ON content.items USING GIN(tags);
CREATE INDEX idx_content_active ON content.items(is_active) WHERE is_active = true;
CREATE INDEX idx_content_sort ON content.items(sort_order);

-- Full-text search on title and description
CREATE INDEX idx_content_search ON content.items 
  USING GIN(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Comments
COMMENT ON TABLE content.items IS 'Learning content: videos, documents, links, courses';
COMMENT ON COLUMN content.items.owner_type IS 'Content ownership: platform (LeaderForge) or tenant';
COMMENT ON COLUMN content.items.visibility IS 'Content visibility: private or licensable (marketplace)';
COMMENT ON COLUMN content.items.metadata IS 'Type-specific metadata (provider info, file details, etc.)';

-- Grant permissions
GRANT SELECT ON content.items TO authenticated;
GRANT ALL ON content.items TO service_role;

