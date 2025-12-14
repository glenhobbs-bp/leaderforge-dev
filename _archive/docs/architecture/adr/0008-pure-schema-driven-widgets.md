# ADR-0008: Pure Schema-Driven Widget Architecture

## Status
Accepted

## Context
Our widget system currently uses a mixed approach where some widgets receive schema objects while others receive individual props. This creates inconsistency for agents and complicates the rendering pipeline.

Current state:
- LeaderForgeCard expects full schema object
- StatCard, Leaderboard, VideoList expect individual props
- WidgetDispatcher handles prop mapping inconsistently
- Agents must understand multiple prop patterns

## Decision
We will standardize on a **Pure Schema-Driven approach** where all widgets receive complete schema objects as their primary interface.

## Rationale

### Agent Experience Priority
- Agents always work with schema objects consistently
- Single pattern to learn and implement
- Reduces cognitive load for agent development

### Production Stability
- Schema evolution without breaking changes
- Built-in versioning and migration support
- Graceful degradation for unknown properties

### Extensibility Benefits
- Metadata can be added without widget changes
- Fallback strategies embedded in schema
- Future-proof for new widget capabilities

### Robust Failure Management
- Schema validation at widget entry point
- Default values and error boundaries
- Graceful handling of malformed data

## Implementation Plan

### Phase 1: Widget Standardization
1. Refactor StatCard to accept schema object
2. Refactor Leaderboard to accept schema object
3. Refactor VideoList to accept schema object
4. Update WidgetDispatcher for uniform prop passing

### Phase 2: Schema Processor Enhancement
1. Implement robust schema validation
2. Add migration support for schema versions
3. Build fallback handling for missing data
4. Create error boundaries for widget failures

### Phase 3: Documentation & Guidelines
1. Create how-to guide for schema-driven widgets
2. Document schema design patterns
3. Provide migration examples
4. Establish testing standards

## Consequences

### Positive
- Consistent agent interface
- Easier widget development
- Better error handling
- Future-proof architecture

### Negative
- Short-term refactoring effort
- Slightly more verbose for simple cases
- Need to maintain schema definitions

### Migration Risk
- Existing widgets need careful refactoring
- Props interface changes require testing
- Temporary mixed state during transition

## Success Criteria
- All widgets accept schema objects uniformly
- Zero prop-mapping logic in WidgetDispatcher
- Comprehensive schema validation
- Working fallback mechanisms
- Complete documentation for developers

## Timeline
- Phase 1: 1-2 days (incremental widget updates)
- Phase 2: 2-3 days (schema processor)
- Phase 3: 1 day (documentation)

## Related
- Links to UniversalSchemaRenderer refactor
- Supports agent-native composition goals
- Aligns with modular monolith architecture