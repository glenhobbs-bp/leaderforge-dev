-- Migration: 015_seed_data
-- Description: Initial seed data for development
-- Date: 2024-12-14
-- Note: This should only be run in development environments

-- ============================================================================
-- SEED TENANT: LeaderForge (Platform)
-- ============================================================================

INSERT INTO core.tenants (id, tenant_key, display_name, theme) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'leaderforge',
  'LeaderForge',
  '{
    "logo_url": "/logos/leaderforge.svg",
    "favicon_url": "/favicons/leaderforge.ico",
    "primary": "#2563eb",
    "secondary": "#64748b",
    "accent": "#f59e0b",
    "background": "#ffffff",
    "surface": "#f8fafc",
    "text_primary": "#0f172a",
    "text_secondary": "#64748b",
    "font_family": "Inter",
    "border_radius": "0.5rem"
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED TENANT: i49 Group (Example Customer)
-- ============================================================================

INSERT INTO core.tenants (id, tenant_key, display_name, theme) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'i49-group',
  'i49 Group',
  '{
    "logo_url": "/logos/i49.svg",
    "favicon_url": "/favicons/i49.ico",
    "primary": "#059669",
    "secondary": "#6b7280",
    "accent": "#dc2626",
    "background": "#ffffff",
    "surface": "#f9fafb",
    "text_primary": "#111827",
    "text_secondary": "#6b7280",
    "font_family": "Inter",
    "border_radius": "0.375rem"
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED ORGANIZATION: i49 Group Main
-- ============================================================================

INSERT INTO core.organizations (id, tenant_id, name, branding) VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  'i49 Group - Main',
  '{
    "logo_url": null,
    "primary_color": null,
    "display_name": null,
    "use_tenant_theme": true
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED TEAMS
-- ============================================================================

INSERT INTO core.teams (id, tenant_id, organization_id, name, description) VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  'Leadership Team',
  'Senior leadership and management'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO core.teams (id, tenant_id, organization_id, name, description) VALUES (
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  'Sales Team',
  'Sales and business development'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED ENTITLEMENTS
-- ============================================================================

INSERT INTO content.entitlements (id, tenant_id, name, description) VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000002',
  'Leadership Foundations',
  'Core leadership training content'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO content.entitlements (id, tenant_id, name, description) VALUES (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000002',
  'Communication Skills',
  'Professional communication training'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED CONTENT
-- ============================================================================

INSERT INTO content.items (id, tenant_id, owner_type, type, title, description, duration_seconds, thumbnail_url, tags) VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000002',
  'platform',
  'video',
  'Introduction to Leadership',
  'An overview of fundamental leadership principles and practices.',
  1800,
  '/thumbnails/leadership-intro.jpg',
  ARRAY['leadership', 'fundamentals', 'management']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO content.items (id, tenant_id, owner_type, type, title, description, duration_seconds, thumbnail_url, tags) VALUES (
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000002',
  'platform',
  'video',
  'Effective Communication',
  'Learn techniques for clear and impactful communication.',
  2400,
  '/thumbnails/communication.jpg',
  ARRAY['communication', 'skills', 'professional']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO content.items (id, tenant_id, owner_type, type, title, description, duration_seconds, thumbnail_url, tags) VALUES (
  '00000000-0000-0000-0000-000000000022',
  '00000000-0000-0000-0000-000000000002',
  'platform',
  'video',
  'Building High-Performance Teams',
  'Strategies for developing and leading successful teams.',
  3600,
  '/thumbnails/teams.jpg',
  ARRAY['leadership', 'teams', 'performance']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO content.items (id, tenant_id, owner_type, type, title, description, thumbnail_url, tags) VALUES (
  '00000000-0000-0000-0000-000000000023',
  '00000000-0000-0000-0000-000000000002',
  'platform',
  'document',
  'Leadership Workbook',
  'Comprehensive workbook with exercises and reflection activities.',
  '/thumbnails/workbook.jpg',
  ARRAY['leadership', 'workbook', 'exercises']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- LINK CONTENT TO ENTITLEMENTS
-- ============================================================================

INSERT INTO content.content_entitlements (content_id, entitlement_id) VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000011')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ASSIGN ENTITLEMENTS TO ORGANIZATION
-- ============================================================================

INSERT INTO content.entitlement_assignments (tenant_id, entitlement_id, organization_id) VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- NOTE: Users and memberships will be created via auth flow
-- ============================================================================
-- When a user signs up with tenant_id in metadata, the handle_new_user trigger
-- will create their core.users record. Memberships should be created via the
-- invitation flow or admin API.

