# Future Enhancements & TODOs — LeaderForge Platform

## High-Priority UX Improvements

### 1. Video Progress Card Update (In-Place Update)
- **Description**: When a user closes a video modal, update only the specific card's progress instead of refreshing the entire ContentPanel
- **Current Behavior**: Video modal closes → Entire ContentPanel re-fetches → All cards re-render
- **Desired Behavior**: Video modal closes → Single card updates progress → No panel refresh
- **Complexity**: Medium - requires state management changes and selective card updates
- **Impact**: Improved UX, better performance, reduced API calls
- **Status**: Identified, not started

---

## Agent-Native Architecture Enhancements

### 2. LangGraph Agent Orchestration
- [ ] Add comprehensive tests for state flow
- [ ] Optimize agent performance and reliability
- [ ] Enhance error handling and recovery patterns

### 3. ContentSyncAgent Production Ready
- [ ] Implement scheduled/webhook-driven content sync from TribeSocial
- [ ] Add comprehensive logging and error handling
- [ ] Create Supabase Edge Function for async triggering
- [ ] Plan for real-time webhook support from TribeSocial

### 4. Navigation Schema Purity
- [ ] Remove hardcoded nav options from NavPanel
- [ ] Drive all navigation from agent/config-driven schema
- [ ] Implement generic nav schema (type: 'NavList', props: { items: [...] })

### 5. Agent Registry System
- [ ] Implement central agent registry
- [ ] Remove direct agent selection in API routes
- [ ] Use config/DB-driven mapping from navOptionId to agent

---

## Technical Debt & Quality

### 6. Error Handling & Reliability
- [ ] Add robust error boundaries in frontend
- [ ] Ensure agents always return valid schema (never null/undefined)
- [ ] Fix periodic Next.js static asset errors on first load
- [ ] Improve backend error logging and user-friendly error surfaces

### 7. General Architectural Cleanup
- [ ] Search and fix all TODO, FIXME, temporary, workaround, hack, patch, hardcoded items
- [ ] Ensure all business logic is in agents/tools, not UI or API
- [ ] Ensure all UI is schema-driven and generic
- [ ] Ensure all tools are stateless, composable, and context-driven

### 8. Testing & Observability
- [ ] Add end-to-end tests for all major flows (content, progress, sync, nav)
- [ ] Add comprehensive logging for all agent runs and tool calls
- [ ] Implement performance monitoring and alerting

---

## User Experience & UI

### 9. Avatar Handling Enhancement
- [ ] Refactor NavPanel to fetch user avatar via signed URL from API
- [ ] Use fallback to default avatar if fetch fails
- [ ] Remove hardcoded userId and wire to real user management
- [ ] Ensure both header and footer avatars use signed URL

### 10. Metadata & SEO
- [x] ~~Enable favicon display by properly configuring metadata~~ ✅ **Complete**
- [ ] Add proper Open Graph meta tags
- [ ] Implement dynamic page titles based on tenant/context
- [ ] Add structured data for better SEO

---

## Development Experience

### 11. Linting & Code Quality
- [ ] Add ESLint configuration for the monorepo
- [ ] Add lint scripts to all package.json files
- [ ] Ensure linting runs in CI and locally
- [ ] Fix all existing linter errors and warnings
- [ ] Document linting rules and workflow

### 12. Environment & Configuration
- [ ] Update Google OAuth credentials for production
- [ ] Ensure all production/staging domains are configured
- [ ] Implement config schema validation
- [ ] Add secrets management for production deployments

---

## Future Feature Enhancements

### 13. Fine-Grained Access Control
- [ ] Implement feature-level entitlements (e.g., analytics, chat)
- [ ] Add content-level access policies
- [ ] Create admin UI for access management
- [ ] Design integration with context-level entitlement

### 14. Worksheets & Assessments
- [ ] Design worksheet system architecture
- [ ] Implement worksheet creation and submission
- [ ] Add progress tracking for worksheet completion
- [ ] Create grading and feedback systems

### 15. Real-Time Features
- [ ] Add real-time progress updates
- [ ] Implement collaborative features
- [ ] Add notification system
- [ ] Support offline capabilities with sync

---

## Performance & Scalability

### 16. Caching & Optimization
- [ ] Implement intelligent content caching
- [ ] Add image optimization and CDN integration
- [ ] Optimize agent response times
- [ ] Add progressive loading for large content sets

### 17. Multi-Tenancy Enhancements
- [ ] Optimize tenant isolation
- [ ] Add tenant-specific customization options
- [ ] Implement tenant analytics and reporting
- [ ] Support white-label deployments

---

## Maintenance Notes

### Review Schedule
- **Monthly**: Review progress on high-priority items
- **Quarterly**: Reassess priorities based on user feedback and business needs
- **Annually**: Archive completed items and major priority restructuring

### Contributing Guidelines
- Add new items under appropriate category
- Include description, complexity, impact, and current status
- Link to related issues, ADRs, or technical discussions
- Mark items as complete with ✅ when finished

---

**Last Updated**: 2024-12-27
**Next Review**: 2025-01-27
**Owner**: Engineering Team