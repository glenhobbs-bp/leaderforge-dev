# PRD: User Input & Response System
**Product Requirements Document**

---

## Executive Summary

LeaderForge's User Input & Response System enables users to engage with leadership content through structured worksheets that evolve from pre-defined forms to dynamic, context-aware experiences. Starting with simple video-linked worksheets, this system creates a foundation for team progress visibility, gamification, and measurable behavioral change in leadership development.

---

## Problem Statement

### Current State
- Users consume video content but have no structured way to apply learnings
- No connection between video content and actionable worksheets
- Team leaders cannot see individual progress or completion status
- Executives lack visibility into team development across organization
- No gamification or engagement incentives for worksheet completion

### User Pain Points
1. **Disconnected Experience**: Watching videos without structured follow-up action
2. **No Progress Visibility**: Team leaders can't track individual development progress
3. **Lack of Accountability**: No system to track Bold Actions or commitments
4. **Generic Experience**: Worksheets don't reflect tenant branding or culture
5. **No Engagement**: Missing gamification elements to encourage participation

---

## User Personas & Use Cases

### Primary Persona: Sarah - Team Leader
**Background**: Manager of 8-person marketing team, using LeaderForge for leadership development
**Goals**: Complete worksheets efficiently, track team progress, implement Bold Actions

**Use Cases**:
- Complete video-linked worksheets (3-5 minutes each)
- Define and track up to 3 Bold Actions with deadlines
- See progress of direct reports on their worksheets
- Use leaderboard to motivate team engagement
- Plan team discussions based on worksheet insights

### Secondary Persona: Marcus - Individual Contributor
**Background**: Senior developer transitioning to leadership role
**Goals**: Complete leadership development, track progress, engage with team

**Use Cases**:
- Complete worksheets after watching leadership videos
- Set and track 1-3 Bold Actions from each video
- See own progress and ranking on team leaderboard
- Share worksheet insights during team discussions

### Supporting Persona: Jennifer - Executive/CEO
**Background**: CEO overseeing multiple teams using LeaderForge
**Goals**: Monitor organization-wide leadership development, identify high-performing teams

**Use Cases**:
- View dashboard of completion rates across all teams
- See aggregated Bold Action trends and success rates
- Identify teams/leaders with highest engagement
- Use leaderboard data to recognize top performers

---

## Success Metrics

### Primary KPIs
- **Completion Rate**: >80% video-to-worksheet completion rate
- **Time to Complete**: Average worksheet completion <3 minutes
- **Bold Action Creation**: >90% of worksheets result in at least 1 Bold Action
- **Progress Visibility**: >95% of team leaders actively monitor direct reports

### Secondary KPIs
- **Leaderboard Engagement**: >60% of users check leaderboard weekly
- **Bold Action Follow-through**: >70% of Bold Actions marked "In Progress" or "Complete"
- **Manager Usage**: >80% of team leaders review team progress monthly
- **Executive Dashboard Usage**: >90% of executives view org-wide metrics monthly

### Behavioral Impact (Ultimate Goal)
- **Video-to-Action Connection**: Clear linkage between video content and workplace application
- **Team Accountability**: Improved team discussion quality based on worksheet insights

---

## User Experience Design

### Phase 1: Video-Linked Worksheets (Foundation)
**Core Experience**: Simple, pre-defined worksheets that follow each video, styled to match tenant branding

**Key Features**:
- **Video Integration**: Direct link from video completion to relevant worksheet
- **Tenant Theming**: Worksheets styled with tenant colors, fonts, and branding
- **Pre-defined Questions**: Curated questions specific to each video's content
- **Bold Action Creation**: Required section for 1-3 actionable commitments
- **Progress Tracking**: Visual indicators of completion and team standing
- **Team Visibility**: Managers see direct report progress and completion status

**UI/UX Principles**:
- **Mobile-first**: Optimized for quick completion on any device
- **3-Question Limit**: Maximum 3 questions per worksheet to reduce cognitive load
- **Tenant Branded**: Custom styling that reflects organization's visual identity
- **Gamified Elements**: Progress bars, completion badges, team leaderboards
- **Save & Resume**: Automatic saving with ability to complete across sessions

**Worksheet Widget Features**:
- Form input fields (text, textarea, select, checkbox)
- Bold Action tracking with deadline selection
- Progress visualization
- Submission confirmation with motivational messaging

### Future Phases: Enhanced Interaction (Vision)
**Note**: These phases represent the future evolution of the system

**Phase 2: Dynamic Worksheets**: AI-powered question adaptation based on user context and previous responses

**Phase 3: Conversational Interface**: Natural language conversation option alongside forms

**Phase 4: Predictive Intelligence**: Proactive suggestions and contextual triggers

---

## Technical Requirements

### Data Schema Requirements
```typescript
interface Worksheet {
  id: string;
  title: string;
  description: string;
  video_id: string; // Links to specific video content
  tenant_key: string; // For tenant-specific theming
  questions: WorksheetQuestion[];
  estimated_time_minutes: number;
  created_at: Date;
  updated_at: Date;
}

interface WorksheetQuestion {
  id: string;
  order: number;
  question_text: string;
  question_type: 'text' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  options?: string[]; // For select/checkbox types
  placeholder?: string;
}

interface WorksheetResponse {
  id: string;
  user_id: string;
  worksheet_id: string;
  responses: QuestionResponse[];
  bold_actions: BoldAction[];
  completion_time_minutes: number;
  submitted_at: Date;
  status: 'draft' | 'submitted';
}

interface QuestionResponse {
  question_id: string;
  answer: string | string[]; // string array for multi-select
}

interface BoldAction {
  id: string;
  user_id: string;
  worksheet_response_id: string;
  title: string;
  description: string;
  deadline: Date;
  status: 'planned' | 'in_progress' | 'complete' | 'deferred';
  created_at: Date;
  updated_at: Date;
}

interface TenantTheme {
  tenant_key: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  logo_url?: string;
  custom_css?: string;
}
```

### Integration Requirements
- **Video Platform**: Link worksheets to specific video content completion
- **Tenant Theming**: Dynamic styling based on tenant branding preferences
- **Progress Tracking**: Real-time completion status for team visibility
- **Leaderboard System**: Gamification scoring and team rankings

### Performance Requirements
- **Response Time**: Form rendering <500ms, worksheet submission <1s
- **Mobile Optimization**: Full functionality on mobile devices
- **Scalability**: Support 1,000+ concurrent worksheet submissions
- **Data Privacy**: Secure storage of responses with tenant-level data isolation

---

## Implementation Strategy

### Phase 1: Core Worksheet System (Weeks 1-3)
**Priority**: Foundational user value with simple worksheets

**Week 1: Database & API Foundation**
- Worksheet and response data schema
- Basic CRUD APIs for worksheets and responses
- Video-to-worksheet linking system
- Bold Action tracking APIs

**Week 2: Worksheet Widget & Theming**
- Worksheet form widget component
- Tenant theming system (colors, fonts, branding)
- Progress tracking and submission flow
- Basic leaderboard widget integration

**Week 3: Team Visibility & Progress**
- Team leader dashboard for direct report progress
- Executive dashboard for org-wide metrics
- Completion status tracking and notifications
- Leaderboard scoring and ranking system

**Success Criteria**:
- Users complete video-to-worksheet flow in <3 minutes
- 80% completion rate achieved
- Team leaders actively use progress dashboards
- Leaderboard drives engagement

### Phase 2: Enhanced Features (Weeks 4-6)
**Priority**: Improved user experience and engagement

**Week 4-5: Advanced Worksheet Features**
- Save/resume functionality for longer worksheets
- Conditional question display (simple branching logic)
- Rich text formatting for responses
- Worksheet templates for common video types

**Week 6: Analytics & Optimization**
- Completion analytics and insights
- Bold Action follow-up tracking
- Team performance metrics
- User engagement optimization

**Success Criteria**:
- Increased completion rates and engagement
- Bold Action follow-through improves
- Team discussions improve based on worksheet insights

---

## Risk Assessment & Mitigation

### Technical Risks
**Risk**: Poor mobile experience reduces completion rates
**Mitigation**: Mobile-first design, responsive forms, touch-optimized inputs

**Risk**: Tenant theming system too complex or slow
**Mitigation**: Pre-cached themes, limited customization scope, performance testing

**Risk**: Progress dashboard performance issues with large teams
**Mitigation**: Pagination, caching, optimized database queries

### Product Risks
**Risk**: Users find worksheets too time-consuming
**Mitigation**: 3-minute target, progress indicators, save/resume functionality

**Risk**: Bold Action tracking becomes overwhelming task list
**Mitigation**: Limit to 3 active actions, simple status updates, optional deadlines

**Risk**: Team leaders don't use progress visibility features
**Mitigation**: Simple dashboards, notification system, managerial training

### Business Risks
**Risk**: Low video-to-worksheet completion rates
**Mitigation**: Seamless integration, motivational messaging, gamification elements

**Risk**: Lack of measurable impact on leadership development
**Mitigation**: Bold Action tracking, before/after assessments, team discussion quality metrics

---

## Open Questions & Decisions Needed

1. **Worksheet Length**: What's the optimal number of questions per worksheet (2-3 vs 3-5)?
2. **Bold Action Limits**: Should we enforce a maximum of 3 Bold Actions per worksheet?
3. **Theming Scope**: How much customization should tenants have (colors only vs full CSS)?
4. **Progress Visibility**: Should individual responses be visible to managers or just completion status?
5. **Leaderboard Scope**: Should leaderboards be team-only, org-wide, or both options?
6. **Video Integration**: Should worksheets auto-launch after video completion or be optional?

---

## Appendix: Competitive Analysis

### Direct Competitors
- **BetterUp**: Strong coaching integration but limited self-directed input
- **15Five**: Excellent weekly check-ins but not leadership-focused
- **Culture Amp**: Great analytics but heavy on surveys vs. development

### Indirect Competitors
- **Typeform/JotForm**: User-friendly forms but no AI or leadership context
- **Notion/Airtable**: Flexible but requires setup, not leadership-optimized
- **Slack/Teams**: Great conversation but no structured development tracking

### Competitive Advantage
LeaderForge's unique combination of:
- Leadership-specific context and content
- AI-powered conversation and analysis
- Hierarchical organizational awareness
- Behavioral change focus vs. just data collection