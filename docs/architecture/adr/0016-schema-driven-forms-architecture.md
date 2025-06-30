# ADR-0016: Schema-Driven Forms Architecture

**Status:** Proposed
**Date:** 2024-01-04
**Supersedes:** N/A
**Superceded by:** N/A

## Summary

Define the architecture for schema-driven forms that integrate with the Universal User Input System, including file storage patterns, cross-tenant privacy boundaries, and JSON Schema-based form rendering using React JSON Schema Form (RJSF).

## Context

### Current State
- Universal User Input System (ADR-0015) provides foundation for all user inputs
- Mockup feedback system exists but lacks persistence
- Need for dynamic, agent-definable forms across multiple contexts (worksheets, feedback, journaling)
- Multiple file types need storage and access control (audio, images, documents)

### Key Requirements
1. **Schema-Driven Forms**: JSON Schema-based forms that agents can dynamically define
2. **File Storage**: Secure, scalable storage for user-uploaded artifacts
3. **Cross-Tenant Privacy**: Context-dependent access control for shared vs private data
4. **Integration**: Seamless integration with existing Universal Input and progress systems

### Privacy Context Examples
- **Journaling**: User-private across all tenants
- **Worksheets**: Team/org accessible within tenant
- **Bug Reports**: Platform admin accessible with tenant context

## Decision

Implement a **Schema-Driven Forms Architecture** with:

1. **JSON Schema-based form definitions** stored in database
2. **User-centric file storage** with database-driven access control
3. **Context-aware privacy boundaries** determined by input purpose
4. **Single FormWidget component** with type-specific renderers

## Architecture

### 1. File Storage Structure

#### Storage Pattern
```
Bucket Path: user/{file_id}
```

**Rationale:**
- ✅ User-owned artifacts pattern (matches avatar system)
- ✅ Simple, no context encoding in storage paths
- ✅ Database handles all relationships and access control
- ✅ Cross-tenant file sharing controlled by privacy levels

#### File Metadata Schema
```sql
CREATE TABLE core.user_files (
    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core.users(id),
    original_filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- "user/{user_id}/{file_id}"
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
    processing_metadata JSONB DEFAULT '{}' -- thumbnails, transcripts, etc.
);
```

#### Access Control Integration
```sql
-- Files linked to inputs via universal_inputs table
{
  "user_id": "123",
  "input_type": "multimodal",
  "input_data": {
    "form_data": {...},
    "attached_files": ["file_abc123", "file_def456"]
  },
  "context_type": "personal_development", -- or "platform_feedback", "team_organizational"
  "privacy_level": "user_private", -- or "admin_accessible", "hierarchy_accessible"
  "source_context": "journal:daily-reflection" -- or "bug-report:dashboard-page"
}
```

### 2. Cross-Tenant Privacy Architecture

#### Privacy Level Mapping
| Context Type | Privacy Level | Cross-Tenant Access | Admin Access |
|-------------|---------------|-------------------|--------------|
| `personal_development` | `user_private` | ✅ Available everywhere user has access | ❌ User-only |
| `team_organizational` | `hierarchy_accessible` | ❌ Tenant-bound only | ✅ Tenant admins |
| `platform_feedback` | `admin_accessible` | ❌ Tenant context preserved | ✅ Platform admins |

#### Examples
**Journaling Audio Files:**
```json
{
  "context_type": "personal_development",
  "privacy_level": "user_private",
  "tenant_key": null, // or current tenant when created
  "source_context": "journal:daily-reflection"
}
```
→ Files accessible to user across ALL tenants, no admin access

**Bug Report Screenshots:**
```json
{
  "context_type": "platform_feedback",
  "privacy_level": "admin_accessible",
  "tenant_key": "brilliant",
  "source_context": "bug-report:dashboard-page"
}
```
→ Files accessible to user + platform admins, tenant context preserved

### 3. Schema-Driven Form System

#### Form Template Storage
```sql
CREATE TABLE core.form_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL UNIQUE,
    json_schema JSONB NOT NULL, -- JSON Schema definition
    ui_schema JSONB DEFAULT '{}', -- RJSF UI Schema for rendering hints
    scoring_schema JSONB, -- Optional scoring configuration
    created_by_agent_id UUID REFERENCES core.agents(id),
    tenant_key TEXT, -- NULL for platform-wide templates
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### FormWidget Component Architecture
```typescript
interface FormWidget {
  templateId: string;
  onSubmit: (data: FormData) => Promise<void>;
  allowFileUpload?: boolean;
  customWidgets?: Record<string, ReactComponent>;
}

// Single component handles all form types
<FormWidget
  templateId="worksheet:video-reflection"
  onSubmit={handleWorksheetSubmit}
  allowFileUpload={true}
  customWidgets={{
    voice: VoiceInputWidget,
    richText: RichTextWidget
  }}
/>
```

#### Custom RJSF Widgets
- **VoiceInputWidget**: Record/upload audio with transcription
- **FileUploadWidget**: Secure file upload to user storage
- **RichTextWidget**: Enhanced text input with formatting
- **MultiSelectWidget**: Dynamic arrays (e.g., "Future Ideas")

### 4. Processing Pipeline

#### File Upload Flow
```typescript
// 1. Immediate: Accept file → Store → Return file_id
POST /api/files/upload
→ Store in user/{file_id}
→ Return { file_id, upload_url }

// 2. Background: Heavy processing
- Content type detection
- Thumbnail generation
- Audio transcription
- Virus scanning
- Metadata extraction
```

#### Form Submission Flow
```typescript
// 1. User submits form with files
const submission = {
  template_id: "worksheet:video-reflection",
  form_data: { /* JSON Schema validated data */ },
  attached_files: ["file_abc123"] // Optional
};

// 2. Submit via Universal Input API
POST /api/input/universal
→ Validates against JSON Schema
→ Links files to input record
→ Triggers derivation engine
→ Updates progress/leaderboard automatically
```

### 5. Widget Registry Evolution

#### Current State: File-Based Registry
```typescript
// packages/asset-core/src/registries/WidgetRegistry.ts
export const WidgetRegistry = {
  StatCard: () => import('../widgets/StatCard'),
  Leaderboard: () => import('../widgets/Leaderboard'),
  // Static imports
};
```

#### Future State: Database-Driven Registry
```sql
CREATE TABLE core.widget_registry (
    widget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_name TEXT NOT NULL UNIQUE,
    widget_schema JSONB NOT NULL, -- Props schema
    component_path TEXT, -- For file-based widgets
    agent_generated BOOLEAN DEFAULT false,
    created_by_agent_id UUID REFERENCES core.agents(id),
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true
);
```

This enables agents to register new widgets dynamically.

## Integration with Existing Systems

### Universal Input System
- Forms submit through `/api/input/universal` endpoint
- Automatic classification based on template metadata
- File attachments linked via `attached_files` array
- All existing derivation rules continue to work

### Progress Tracking
- Use existing `core.user_progress` table
- Database triggers for automatic progress updates
- Maintain "capture once, derive everything" pattern

### Authentication
- Service role access ONLY for file uploads (similar to avatar uploads)
- All other operations use SSR authentication patterns
- RLS policies enforce privacy boundaries

## Benefits

### 1. Agent-Definable Forms
- Agents can create new form types without code deployment
- JSON Schema provides validation and documentation
- Custom widgets enable rich input types

### 2. Unified File Storage
- Single pattern for all file types (audio, images, documents)
- Automatic privacy boundary enforcement
- Cross-tenant sharing where appropriate

### 3. Scalable Privacy Model
- Context-driven privacy determination
- Automatic routing to appropriate access levels
- Future-proof for new privacy requirements

### 4. Development Velocity
- Single FormWidget component for all form types
- Database-driven configuration reduces code changes
- Rich ecosystem of RJSF widgets

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create `core.form_templates` table
- [ ] Create `core.user_files` table
- [ ] Implement file upload API endpoint
- [ ] Basic FormWidget with JSON Schema validation

### Phase 2: Universal Input Integration (Week 2)
- [ ] Update Universal Input API for file attachments
- [ ] Implement privacy level classification
- [ ] Database triggers for automatic progress updates
- [ ] RLS policies for file access

### Phase 3: Rich Input Types (Week 3)
- [ ] Custom RJSF widgets (voice, file, rich text)
- [ ] Background file processing pipeline
- [ ] Template management admin interface
- [ ] End-to-end testing

## Examples

### Video Reflection Worksheet Template
```json
{
  "template_name": "worksheet:video-reflection",
  "json_schema": {
    "type": "object",
    "required": ["top_insights", "big_idea", "timeframe", "bold_action"],
    "properties": {
      "top_insights": {
        "type": "array",
        "title": "Top 3 Insights",
        "minItems": 3,
        "maxItems": 3,
        "items": { "type": "string" }
      },
      "big_idea": {
        "type": "string",
        "title": "One Big Idea",
        "ui:widget": "textarea"
      },
      "timeframe": {
        "type": "string",
        "title": "Expected Timeframe",
        "enum": ["1 week", "2 weeks", "3 weeks"]
      },
      "bold_action": {
        "type": "string",
        "title": "Bold Action",
        "ui:widget": "textarea"
      },
      "future_ideas": {
        "type": "array",
        "title": "Future Ideas",
        "items": { "type": "string", "ui:widget": "textarea" },
        "ui:options": { "addable": true, "removable": true }
      }
    }
  },
  "scoring_schema": {
    "completion_points": 10,
    "quality_multiplier": {
      "big_idea_length": { "min": 50, "bonus": 2 },
      "future_ideas_count": { "min": 2, "bonus": 1 }
    }
  }
}
```

## Risks and Mitigations

### Risk: File Storage Costs
**Mitigation**: Implement lifecycle policies, compression, and cleanup strategies

### Risk: Cross-Tenant Data Leakage
**Mitigation**: Comprehensive RLS policies and access testing

### Risk: Form Schema Breaking Changes
**Mitigation**: Schema versioning and backward compatibility validation

## Success Criteria

- [ ] Single FormWidget renders all form types from JSON Schema
- [ ] Files stored securely with appropriate cross-tenant access
- [ ] Forms integrate seamlessly with Universal Input System
- [ ] Progress tracking automatically derived from form submissions
- [ ] Zero code deployment needed for new form types
- [ ] Sub-200ms form rendering performance

## Notes

This architecture enables dynamic, agent-driven form creation while maintaining security, performance, and integration with existing systems. The file storage pattern provides flexibility for future multimodal input requirements.