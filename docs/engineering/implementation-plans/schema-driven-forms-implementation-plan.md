# Schema-Driven Forms Implementation Plan

**Project:** Schema-Driven Forms System
**Timeline:** 3 weeks (21 days)
**Dependencies:** Universal Input System (ADR-0015), Forms Architecture (ADR-0016)
**Owner:** Engineering Team

## Executive Summary

Implement a comprehensive schema-driven forms system that enables dynamic form creation through JSON Schema, integrates with the Universal Input System for data persistence, and supports rich input types including file uploads and voice input.

## Project Phases

### Phase 1: Core Infrastructure (Days 1-7)
**Goal:** Build foundational database schema, file storage, and basic form rendering

#### Week 1 Tasks

**Day 1-2: Database Foundation**
- [ ] **Task 1.1**: Create `core.form_templates` table
  - [ ] JSON Schema storage with validation
  - [ ] UI Schema for rendering hints
  - [ ] Scoring schema for automatic point calculation
  - [ ] Version control and tenant isolation

- [ ] **Task 1.2**: Create `core.user_files` table
  - [ ] File metadata storage (name, size, type, processing status)
  - [ ] Link to universal_inputs via attached_files array
  - [ ] Storage path pattern: `user/{file_id}`

- [ ] **Task 1.3**: Extend `core.universal_inputs` table
  - [ ] Add `attached_files TEXT[]` column
  - [ ] Update RLS policies for file access control
  - [ ] Create indexes for performance

**Day 3-4: File Upload System**
- [ ] **Task 1.4**: Implement `/api/files/upload` endpoint
  - [ ] Secure file upload to Supabase Storage
  - [ ] File type validation and virus scanning
  - [ ] Generate signed URLs for downloads
  - [ ] Return file_id for form association

- [ ] **Task 1.5**: File processing pipeline
  - [ ] Background content type detection
  - [ ] Image thumbnail generation
  - [ ] Audio transcription setup (future)
  - [ ] Metadata extraction

**Day 5-7: Basic Form Infrastructure**
- [ ] **Task 1.6**: Install and configure React JSON Schema Form (RJSF)
  - [ ] Add @rjsf/core, @rjsf/utils packages
  - [ ] Configure base theme (Bootstrap 5 or custom)
  - [ ] Set up TypeScript types for schemas

- [ ] **Task 1.7**: Create basic FormWidget component
  - [ ] Accept templateId prop and fetch schema from API
  - [ ] Render form using RJSF with basic validation
  - [ ] Handle form submission via Universal Input API
  - [ ] Error handling and loading states

#### Phase 1 Success Criteria
- [ ] Form templates can be stored and retrieved from database
- [ ] Files can be uploaded securely and linked to forms
- [ ] Basic forms render from JSON Schema
- [ ] Form submissions persist via Universal Input System
- [ ] RLS policies enforce proper access control

---

### Phase 2: Universal Input Integration (Days 8-14)
**Goal:** Deep integration with existing systems and automatic derivations

#### Week 2 Tasks

**Day 8-9: Universal Input API Enhancement**
- [ ] **Task 2.1**: Update `/api/input/universal` for file attachments
  - [ ] Accept attached_files array in request
  - [ ] Validate file ownership and access
  - [ ] Link files to universal_inputs record
  - [ ] Handle multimodal input classification

- [ ] **Task 2.2**: Privacy level classification logic
  - [ ] Automatic context_type detection from source_context
  - [ ] Privacy level mapping based on form template metadata
  - [ ] Cross-tenant access rule enforcement

**Day 10-11: Progress Tracking Integration**
- [ ] **Task 2.3**: Database triggers for automatic progress updates
  - [ ] Create `update_progress_from_input()` trigger function
  - [ ] Update existing `core.user_progress` table automatically
  - [ ] Handle completion percentage and scoring
  - [ ] Conflict resolution for duplicate submissions

- [ ] **Task 2.4**: Leaderboard scoring integration
  - [ ] Extend leaderboard calculation to include form submissions
  - [ ] Point calculation based on scoring_schema
  - [ ] Quality bonuses for detailed responses
  - [ ] Real-time score updates

**Day 12-14: Form Template Management**
- [ ] **Task 2.5**: Form template API endpoints
  - [ ] `GET /api/form-templates/{templateId}` - Fetch template
  - [ ] `POST /api/form-templates` - Create template (admin only)
  - [ ] `PUT /api/form-templates/{templateId}` - Update template
  - [ ] Template validation and version control

- [ ] **Task 2.6**: Template seeding system
  - [ ] Create video reflection worksheet template
  - [ ] Bug report form template
  - [ ] Mockup feedback template
  - [ ] Database migration for initial templates

#### Phase 2 Success Criteria
- [ ] Form submissions automatically update progress tracking
- [ ] Leaderboard points calculated from form completion
- [ ] File attachments work end-to-end with privacy controls
- [ ] Form templates manageable via API
- [ ] All existing Universal Input derivations continue working

---

### Phase 3: Rich Input Types & UX (Days 15-21)
**Goal:** Enhanced user experience with custom widgets and polished interface

#### Week 3 Tasks

**Day 15-16: Custom RJSF Widgets**
- [ ] **Task 3.1**: FileUploadWidget
  - [ ] Drag-and-drop file upload interface
  - [ ] Upload progress indicators
  - [ ] File preview for images
  - [ ] File type restrictions per form template

- [ ] **Task 3.2**: VoiceInputWidget (foundation)
  - [ ] Basic audio recording functionality
  - [ ] Waveform visualization
  - [ ] Playback controls
  - [ ] File upload integration

- [ ] **Task 3.3**: RichTextWidget
  - [ ] Enhanced textarea with formatting options
  - [ ] Character count and validation
  - [ ] Auto-resize functionality
  - [ ] Markdown support (optional)

**Day 17-18: Form UX Enhancements**
- [ ] **Task 3.4**: Dynamic array handling
  - [ ] "Add another item" functionality for arrays
  - [ ] Remove item with confirmation
  - [ ] Drag-and-drop reordering
  - [ ] Maximum item limits

- [ ] **Task 3.5**: Form validation and feedback
  - [ ] Real-time validation with helpful error messages
  - [ ] Required field indicators
  - [ ] Save draft functionality
  - [ ] Form completion progress indicator

**Day 19-21: Integration & Testing**
- [ ] **Task 3.6**: Complete video reflection worksheet integration
  - [ ] Replace VideoWorksheetForm in MarcusDashboardMockup
  - [ ] Test with actual video context
  - [ ] Verify progress and leaderboard updates
  - [ ] End-to-end user testing

- [ ] **Task 3.7**: Performance optimization
  - [ ] Form schema caching
  - [ ] Lazy loading for large forms
  - [ ] File upload optimization
  - [ ] Bundle size analysis

#### Phase 3 Success Criteria
- [ ] Custom widgets enhance form UX significantly
- [ ] Video worksheet works seamlessly in MarcusDashboard
- [ ] File uploads support multiple types with good UX
- [ ] Form performance is sub-200ms for rendering
- [ ] All accessibility requirements met

---

## Technical Implementation Details

### Database Schema Migrations

```sql
-- Migration 1: Form Templates
CREATE TABLE core.form_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL UNIQUE,
    json_schema JSONB NOT NULL,
    ui_schema JSONB DEFAULT '{}',
    scoring_schema JSONB,
    created_by_agent_id UUID REFERENCES core.agents(id),
    tenant_key TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration 2: User Files
CREATE TABLE core.user_files (
    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core.users(id),
    original_filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processing_status TEXT DEFAULT 'pending',
    processing_metadata JSONB DEFAULT '{}'
);

-- Migration 3: Extend Universal Inputs
ALTER TABLE core.universal_inputs
ADD COLUMN attached_files TEXT[] DEFAULT '{}';
```

### API Endpoints

```typescript
// Form Templates
GET    /api/form-templates/{templateId}
POST   /api/form-templates
PUT    /api/form-templates/{templateId}
DELETE /api/form-templates/{templateId}

// File Upload
POST   /api/files/upload
GET    /api/files/{fileId}
DELETE /api/files/{fileId}

// Universal Input (enhanced)
POST   /api/input/universal
```

### Component Architecture

```typescript
// Core FormWidget
interface FormWidgetProps {
  templateId: string;
  initialData?: any;
  onSubmit: (data: FormData) => Promise<void>;
  allowFileUpload?: boolean;
  customWidgets?: Record<string, React.ComponentType>;
}

// Custom Widgets
interface CustomWidget {
  VoiceInputWidget: React.ComponentType<WidgetProps>;
  FileUploadWidget: React.ComponentType<WidgetProps>;
  RichTextWidget: React.ComponentType<WidgetProps>;
}
```

## Risk Mitigation

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| RJSF complexity | High | Medium | Start with simple forms, iterate |
| File storage costs | Medium | High | Implement lifecycle policies early |
| Performance issues | High | Medium | Performance testing in Phase 3 |
| Schema breaking changes | High | Low | Version control and validation |

### Timeline Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Custom widgets take longer | Medium | High | Prioritize core functionality first |
| Integration issues | High | Medium | Daily integration testing |
| Scope creep | Medium | High | Strict adherence to MVP scope |

## Success Metrics

### Technical Metrics
- [ ] Form rendering performance: < 200ms
- [ ] File upload performance: < 5s for 10MB files
- [ ] Schema validation time: < 50ms
- [ ] API response times: < 100ms (95th percentile)

### User Experience Metrics
- [ ] Form completion rate: > 85%
- [ ] User error rate: < 5%
- [ ] Time to complete video worksheet: < 3 minutes
- [ ] File upload success rate: > 99%

### Integration Metrics
- [ ] Progress tracking accuracy: 100%
- [ ] Leaderboard update latency: < 1 second
- [ ] Cross-tenant file access working correctly
- [ ] Zero data loss or corruption

## Dependencies & Blockers

### External Dependencies
- [ ] React JSON Schema Form (@rjsf/core)
- [ ] Supabase Storage configuration
- [ ] File processing services (future)

### Internal Dependencies
- [ ] Universal Input System (ADR-0015) - **Critical**
- [ ] Existing progress tracking system
- [ ] Current leaderboard implementation
- [ ] Authentication and RLS policies

### Potential Blockers
- [ ] Supabase Storage bucket configuration
- [ ] File upload size limits and costs
- [ ] Custom widget complexity
- [ ] Integration with existing MarcusDashboard

## Testing Strategy

### Unit Testing
- [ ] Form schema validation
- [ ] File upload functionality
- [ ] Custom widget behavior
- [ ] API endpoint responses

### Integration Testing
- [ ] End-to-end form submission flow
- [ ] Progress tracking integration
- [ ] File attachment workflows
- [ ] Cross-tenant access controls

### User Acceptance Testing
- [ ] Video worksheet completion flow
- [ ] File upload user experience
- [ ] Mobile responsiveness
- [ ] Accessibility compliance

## Deployment Plan

### Staging Deployment (Day 7, 14, 21)
- [ ] Database migrations
- [ ] Feature flags for gradual rollout
- [ ] Performance monitoring
- [ ] User feedback collection

### Production Deployment (Day 22)
- [ ] Full system backup
- [ ] Phased rollout by tenant
- [ ] Monitoring and alerting
- [ ] Rollback plan ready

## Post-Implementation

### Immediate Follow-up (Week 4)
- [ ] Performance optimization based on real usage
- [ ] Bug fixes from user feedback
- [ ] Documentation updates
- [ ] Team training on new system

### Future Enhancements
- [ ] Voice transcription integration
- [ ] Advanced file processing (thumbnails, metadata)
- [ ] Form analytics and insights
- [ ] Agent-generated form capabilities

---

**Last Updated:** 2024-01-04
**Next Review:** Daily standups during implementation
**Project Owner:** [To be assigned]
**Technical Lead:** [To be assigned]