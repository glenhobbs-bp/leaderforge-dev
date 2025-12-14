# ADR-0001: Fresh Start with Simplified Architecture

## Status
**Accepted** - December 2024

## Context

The LeaderForge codebase was originally built using an Agent-Native Architecture (ANA) approach where:
- UI components were dynamically composed by AI agents at runtime
- A Universal Widget Schema defined how agents described UI compositions
- LangGraph orchestrated agentic workflows for content delivery
- CopilotKit provided conversational interface capabilities

### Problems Identified

1. **Overengineered for MVP**: The ANA architecture solved problems we don't have yet (dynamic UI composition, conversational customization)

2. **Missing Core Features**: The multi-tenant hierarchy (Platform > Org > Team > User) was not implemented despite being a core requirement

3. **Complexity vs. Value**: 
   - Agent invocation required polling for results
   - 10x more code for simple content delivery
   - Complex session restoration logic

4. **Performance Concerns**: Runtime agent composition adds latency compared to traditional server rendering

5. **Solo Developer Context**: Architecture complexity makes iteration slower for a small team

### Current Situation
- No production users
- MVP requirements: Content delivery, progress tracking, org admin
- AI/agent features are "nice to have" for future, not MVP
- TribeSocial (content backend) may be replaced with Supabase

## Decision

**Start fresh with a simplified, LMS-focused architecture** while preserving the valuable patterns from the previous codebase as reference.

### New Architecture Principles

1. **Traditional Server-Side Rendering**: Next.js App Router with Server Components, no runtime agent composition

2. **Multi-Tenant First**: Proper hierarchy (Tenant > Organization > Team > User) built from the start

3. **Service Layer Pattern**: Business logic in services, thin API routes, no direct DB access from UI

4. **Supabase as Backend**: Database, auth, and storage with RLS for security

5. **Theming (Option 2)**: Tenant full theming + Organization partial override

### What We Keep (Cherry-Pick)
- SSR authentication patterns
- RLS policy designs
- User progress tracking schema
- Type definition patterns

### What We Remove
- Agent-Native Composition system
- Universal Widget Schema
- LangGraph integration
- CopilotKit integration
- Dynamic UI composition

## Consequences

### Positive
- **Faster MVP delivery**: No agent overhead, straightforward development
- **Simpler debugging**: Traditional request/response flow
- **Better performance**: No agent polling, direct database queries
- **Correct data model**: Multi-tenant hierarchy from day one
- **Easier maintenance**: Standard patterns, less custom infrastructure

### Negative
- **Lose dynamic composition**: Can't adapt UI via conversation (future feature)
- **Sunk cost**: Previous development work archived, not used directly
- **Re-implementation**: Some features need to be rebuilt

### Neutral
- **Agent features deferred**: Can be added later when there's actual demand
- **Architecture is extensible**: Nothing prevents adding agents in the future

## Alternatives Considered

### 1. Refactor Existing Codebase
**Rejected**: The multi-tenant hierarchy would require significant changes throughout. Starting fresh is faster and cleaner.

### 2. Keep ANA, Add Multi-Tenant
**Rejected**: Would compound complexity. ANA patterns don't provide value for MVP features.

### 3. Microservices Architecture
**Rejected**: Overkill for current team size and requirements. Modular monolith is appropriate.

## Implementation

1. Archive existing code to `_archive/` directory
2. Create clean project structure
3. Define simplified Cursor rules
4. Document architecture principles
5. Design database schema with proper hierarchy
6. Build features incrementally

## Related Decisions

- ADR-0002: Theming Strategy (Option 2)
- ADR-0003: Database Schema Design (pending)

## References

- Previous architecture: `_archive/docs/architecture/`
- Valuable patterns: `_archive/apps/web/app/lib/`
- Progress schema: `_archive/sql/create_universal_progress_table.sql`

