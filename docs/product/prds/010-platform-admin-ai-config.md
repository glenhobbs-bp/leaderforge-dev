# PRD-010: Platform Admin & AI Configuration

## Overview

LeaderForge requires two levels of administrative access beyond Organization Admin:

1. **Platform Admin** - LeaderForge team managing the multi-tenant platform
2. **AI Configuration** - Ability to tune and customize AI-powered features

This PRD defines the platform admin role and the AI configuration system.

## Admin Hierarchy

```
Platform Admin (LeaderForge Team)
├── Manage Tenants (create, configure, billing)
├── Configure AI Prompts & Context
├── Platform-wide Settings
├── System Health & Monitoring
└── Feature Flags

Tenant Admin (e.g., i49 Group Admin)
├── Manage Organizations within Tenant
├── Tenant-level Theming
├── Tenant AI Customization (Phase 3)
└── Tenant Feature Configuration

Org Admin (Customer Company Admin)
├── Manage Users & Teams
├── Content Sequencing
├── Signoff Configuration
└── Org AI Customization (Phase 4)
```

## Problem Statement

### Platform Admin
- Need centralized management of all tenants
- Need ability to configure platform-wide settings
- Need visibility into system health and usage

### AI Configuration
- AI prompts are currently hardcoded
- Different tenants may want different AI behaviors
- Need ability to tune conversation starters, tone, focus areas
- Need A/B testing capability for prompt optimization

## Platform Admin Features

### Phase 1 (MVP Placeholder)
- [ ] Platform Admin role in database
- [ ] Platform Admin check in middleware/routes
- [ ] Basic `/platform-admin` route structure

### Phase 2
- [ ] Tenant Management Dashboard
  - List all tenants
  - Create new tenant
  - Edit tenant settings
  - View tenant usage/billing
- [ ] System Health Dashboard
  - API response times
  - Error rates
  - Active users

### Phase 3
- [ ] AI Configuration Interface
- [ ] Feature Flags Management
- [ ] Audit Log Viewer

## AI Configuration System

### Configuration Hierarchy

```
Platform Default (base prompts)
    └── Tenant Override (optional customization)
        └── Organization Override (future, optional)
```

### Configurable Elements

| Element | Description | Example |
|---------|-------------|---------|
| `cheat_sheet_prompt` | Main prompt for AI check-in cheat sheet | System prompt with context |
| `conversation_starters` | Template for conversation starter tips | "Ask about...", "Celebrate..." |
| `tone_guidance` | AI personality/voice | "Coaching", "Directive", "Supportive" |
| `focus_areas` | What AI should emphasize | "Accountability", "Growth", "Support" |
| `custom_questions` | Additional questions to include | "How's work-life balance?" |
| `terminology_map` | Brand-specific term replacements | "Bold Action" → "Commitment" |

### Data Model

```sql
-- Schema: platform
CREATE SCHEMA IF NOT EXISTS platform;

-- Platform-level AI configuration (defaults)
CREATE TABLE platform.ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example entries:
-- config_key: 'cheat_sheet_system_prompt'
-- config_key: 'cheat_sheet_tone'
-- config_key: 'conversation_starter_templates'
-- config_key: 'terminology'

-- Tenant-level AI overrides
CREATE TABLE core.tenant_ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, config_key)
);

-- Platform admin users
CREATE TABLE platform.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'viewer')),
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### AI Config Resolution

When generating AI content:

```typescript
async function getAIConfig(configKey: string, tenantId?: string): Promise<AIConfig> {
  // 1. Check tenant override
  if (tenantId) {
    const tenantConfig = await getTenantAIConfig(tenantId, configKey);
    if (tenantConfig) return tenantConfig;
  }
  
  // 2. Fall back to platform default
  return getPlatformAIConfig(configKey);
}
```

### Configuration UI (Phase 3)

```
┌─────────────────────────────────────────────────────────────┐
│ Platform Admin > AI Configuration                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Check-in Cheat Sheet                                        │
│ ─────────────────────                                       │
│                                                             │
│ System Prompt:                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ You are an expert leadership coach helping a team       │ │
│ │ leader prepare for a 5-minute check-in meeting...       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Tone: [ Coaching ▼ ]                                        │
│                                                             │
│ Conversation Starter Templates:                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. Address their question: "{question}"                 │ │
│ │ 2. Ask: "Scale of 1-10, how confident..."               │ │
│ │ 3. {if streak > 3} Celebrate their streak!              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [ Preview ] [ Save Draft ] [ Publish ]                      │
│                                                             │
│ Version History ─────────────────────                       │
│ • v3 (current) - Dec 14, 2025                               │
│ • v2 - Dec 10, 2025                                         │
│ • v1 - Dec 1, 2025                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## User Stories

### As a Platform Admin
- I can view and manage all tenants
- I can configure AI prompts and see their effects
- I can version AI configurations and rollback if needed
- I can A/B test different prompt variations
- I can view system health and usage metrics

### As a Tenant Admin (Phase 3)
- I can override specific AI configurations for my tenant
- I can customize the tone and focus of AI features
- I can add custom terminology for my organization

## API Endpoints

### Platform Admin
- `GET /api/platform/tenants` - List all tenants
- `POST /api/platform/tenants` - Create tenant
- `GET /api/platform/health` - System health metrics

### AI Configuration
- `GET /api/platform/ai-config` - List all AI configs
- `GET /api/platform/ai-config/:key` - Get specific config
- `PUT /api/platform/ai-config/:key` - Update config
- `POST /api/platform/ai-config/:key/publish` - Publish config version
- `GET /api/platform/ai-config/:key/history` - Version history

### Tenant AI Override (Phase 3)
- `GET /api/tenant/:id/ai-config` - List tenant overrides
- `PUT /api/tenant/:id/ai-config/:key` - Set override

## Implementation Phases

### Phase 1 (MVP Placeholder) ← Current
- [x] Define admin hierarchy in PRD
- [ ] Add `is_platform_admin` flag to users
- [ ] Create `/platform-admin` route with access check
- [ ] Basic "Coming Soon" placeholder UI

### Phase 2
- [ ] Platform schema and tables
- [ ] Tenant Management CRUD
- [ ] System Health Dashboard

### Phase 3
- [ ] AI Configuration tables
- [ ] AI Config management UI
- [ ] Dynamic prompt loading in AI routes
- [ ] Version history and rollback

### Phase 4
- [ ] Tenant-level AI overrides
- [ ] A/B testing framework
- [ ] Analytics on AI effectiveness

## Security Considerations

- Platform Admin routes require `is_platform_admin` check
- AI configuration changes should be audited
- Tenant admins cannot access platform admin features
- API keys and secrets never stored in AI config

## Success Metrics

- Time to configure new AI prompt: < 5 minutes
- Rollback time on bad config: < 30 seconds
- Tenant customization adoption rate
- AI feature satisfaction scores

## Open Questions

1. Should AI configs be real-time or require deployment?
2. How to handle config conflicts between tenant and platform?
3. Should we expose A/B test results to tenant admins?
4. Rate limiting on AI config preview/testing?

