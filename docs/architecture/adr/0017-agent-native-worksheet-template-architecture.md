# ADR-0017: Agent-Native Worksheet Template Architecture

**Status:** Approved
**Date:** 2024-01-04
**Supersedes:** N/A
**Superceded by:** N/A
**Related:** ADR-0015 (Universal User Input System), ADR-0016 (Schema-Driven Forms Architecture)

## Summary

Design an agent-native worksheet architecture that evolves from static template assignment to dynamic, contextual worksheet generation fully orchestrated by AI agents through prompts and content analysis.

## Context

### Current Anti-Pattern
The initial implementation used hardcoded template selection logic:
```typescript
// ANTI-PATTERN: Hardcoded business logic
function getWorksheetTemplateId(title: string): string {
  if (titleLower.includes('project')) {
    return 'aa1f72eb-1234-5678-9abc-def123456789'; // Project Management
  }
  return '663570eb-babd-41cd-9bfa-18972275863b'; // Video Reflection
}
```

**Problems with this approach:**
- ❌ Business logic in code instead of agent prompts
- ❌ Not observable in agent traces (LangSmith)
- ❌ Requires code deployment to change worksheet selection
- ❌ Cannot adapt to user context, progress, or learning objectives
- ❌ Violates agent-native architecture principles

### Agent-Native Vision
LeaderForge is an **agent-native platform** where all business logic should be orchestrated by agents, not hardcoded in application code. Worksheet template selection should be:
- ✅ Driven by agent prompts and intelligence
- ✅ Observable and auditable via agent traces
- ✅ Adaptable without code deployment
- ✅ Contextual to user state and content analysis
- ✅ Capable of dynamic worksheet generation

## Decision

Implement a **three-phase evolution** from static assignment to fully dynamic agent-native worksheet generation:

### Phase 1: Static Template Assignment with Agent Awareness
**Status:** ✅ Implemented
**Timeline:** Immediate (for MVP functionality)

```typescript
// Current implementation - minimal but functional
parameters: {
  templateId: '663570eb-babd-41cd-9bfa-18972275863b', // Video Reflection Worksheet
  contentId: content.id,
  title: content.title,
  videoId: content.id
}
```

**Agent Configuration:**
- Agent prompt includes: "For Leadership Library videos, apply the Video Reflection Worksheet template"
- Template ID is statically assigned but documented as agent-driven decision
- Foundation for future agent intelligence

### Phase 2: Agent-Driven Template Selection
**Status:** 🔄 Planned
**Timeline:** Q1 2024

```typescript
// Agent will determine templateId dynamically
interface AgentWorksheetResponse {
  templateId: string;
  reasoning: string;
  customizations?: WorksheetCustomization[];
}
```

**Agent Intelligence:**
- Agent analyzes content type, learning objectives, user progress
- Agent selects from available template registry
- Agent can customize existing templates for specific content
- All decisions visible in agent traces

**Enhanced Agent Prompt:**
```
You are responsible for selecting the optimal worksheet template for each piece of content.

Available Templates:
- Video Reflection Worksheet (663570eb-babd-41cd-9bfa-18972275863b): General video reflection
- Leadership Assessment (aa1f72eb-1234-5678-9abc-def123456789): Project management focus
- [Additional templates as they're created]

Selection Criteria:
- Content type and learning objectives
- User's role and experience level
- Previous worksheet completion patterns
- Organizational context and culture

For each content item, specify:
1. templateId: Selected template identifier
2. reasoning: Why this template is optimal
3. customizations: Any content-specific adaptations needed
```

### Phase 3: Dynamic Worksheet Generation
**Status:** 🌟 Future Vision
**Timeline:** Q2-Q3 2024

```typescript
// Agent generates worksheet schema dynamically
interface GeneratedWorksheet {
  schema: JSONSchema;
  uiSchema: UISchema;
  scoringRules: ScoringSchema;
  metadata: WorksheetMetadata;
}
```

**Full Agent-Native Generation:**
- Agent analyzes video content, transcript, learning objectives
- Agent generates contextual reflection questions dynamically
- Agent adapts to user's learning style and progress history
- Agent creates assessment criteria specific to content
- Zero static templates needed for common scenarios

**Advanced Agent Prompt:**
```
Generate a contextual worksheet for the provided video content.

Video Analysis:
- Main concepts and learning objectives
- Key takeaways and action items
- Difficulty level and prerequisites
- Duration and engagement patterns

User Context:
- Role and experience level
- Previous learning completion patterns
- Current challenges and goals
- Team/organizational context

Worksheet Requirements:
- 3-5 reflection questions that reinforce key concepts
- 1-2 practical application exercises
- 1 commitment/action item section
- Estimated completion time: 5-10 minutes
- Questions should build on each other progressively

Output the complete worksheet as a JSON Schema that can be rendered by our form system.
```

## Architecture Benefits

### Phase 1 Benefits (Immediate)
- ✅ **Functional MVP**: Worksheets work correctly for Leadership Library
- ✅ **Architecture Foundation**: Prepares for agent-native evolution
- ✅ **Observable Intent**: Comments document agent-driven future
- ✅ **Stable Implementation**: No complex logic, predictable behavior

### Phase 2 Benefits (Agent Intelligence)
- ✅ **True Agent-Native**: Business logic moves to prompts where it belongs
- ✅ **Observable Decisions**: All template selection visible in agent traces
- ✅ **Contextual Intelligence**: Considers user state and content analysis
- ✅ **No-Code Updates**: Template selection logic updated via prompt changes
- ✅ **Scalable**: Handles unlimited content types without code changes

### Phase 3 Benefits (Dynamic Generation)
- ✅ **Infinite Adaptability**: Every worksheet perfectly tailored to content
- ✅ **Learning Optimization**: Questions adapt to user's learning patterns
- ✅ **Content Integration**: Worksheet questions reference specific video points
- ✅ **Automatic Scaling**: New content automatically gets appropriate worksheets
- ✅ **AI-Enhanced Learning**: Leverages latest AI capabilities for education

## Implementation Plan

### Phase 1: Immediate Implementation ✅
- [x] Remove hardcoded template selection function
- [x] Document agent-native architecture intent
- [x] Use static template assignment with clear evolution path
- [x] Add comprehensive architecture documentation

### Phase 2: Agent-Driven Selection (Q1 2024)
- [ ] Create template registry with metadata
- [ ] Enhance agent prompt with template selection logic
- [ ] Update agent response schema to include `templateId`
- [ ] Implement agent trace logging for decisions
- [ ] Add template customization capabilities

### Phase 3: Dynamic Generation (Q2-Q3 2024)
- [ ] Build worksheet schema generation tools
- [ ] Enhance agent with content analysis capabilities
- [ ] Implement dynamic form rendering from agent schemas
- [ ] Add learning effectiveness feedback loops
- [ ] Create quality assurance for generated worksheets

## Success Criteria

### Phase 1 Success Metrics
- [ ] All Leadership Library videos use correct worksheet template
- [ ] Zero hardcoded business logic in worksheet selection
- [ ] Clear documentation of agent-native evolution path
- [ ] Foundation ready for Phase 2 implementation

### Phase 2 Success Metrics
- [ ] 100% of template selection decisions visible in agent traces
- [ ] Agent can select from 5+ different worksheet templates
- [ ] Template selection adapts to user context and content type
- [ ] Zero code deployment needed to change selection logic

### Phase 3 Success Metrics
- [ ] Agent generates contextual worksheets for 90%+ of content
- [ ] Generated worksheets show measurable learning improvement
- [ ] Worksheet completion rates increase vs. static templates
- [ ] User satisfaction with worksheet relevance increases

## Technical Considerations

### Backward Compatibility
- All phases maintain API compatibility
- Existing static templates continue to work
- Progressive enhancement approach

### Performance
- Phase 1: Zero performance impact (static assignment)
- Phase 2: Minimal impact (single agent decision per content load)
- Phase 3: Optimized generation with caching for repeated content

### Observability
- Phase 1: Basic logging and documentation
- Phase 2: Full agent trace integration (LangSmith)
- Phase 3: Learning analytics and effectiveness metrics

## Risks and Mitigations

### Risk: Agent Generation Quality
**Mitigation:**
- Gradual rollout with A/B testing
- Fallback to curated templates
- Quality scoring and feedback loops

### Risk: Performance Impact
**Mitigation:**
- Caching of generated worksheets
- Async generation for non-critical paths
- Progressive enhancement approach

### Risk: Complexity Increase
**Mitigation:**
- Clear phase boundaries with success criteria
- Maintain simple fallbacks at each phase
- Comprehensive testing and validation

## Notes

This architecture represents the evolution from **reactive development** (hardcoded solutions) to **proactive AI-native development** (agent-orchestrated intelligence). Each phase builds on the previous while maintaining functional capabilities.

The key insight is that worksheet template selection is not a technical problem to be solved with code, but a **pedagogical decision** that should be made by AI agents with deep understanding of content, context, and user needs.

---

**Last Updated:** 2024-01-04
**Next Review:** Phase 2 planning (Q1 2024)
**Implementation Owner:** Engineering Team
**Agent Configuration Owner:** AI/Prompt Engineering Team