# Universal Progress Tool Architecture Decision

**Date**: 2024-12-19
**Status**: Approved
**Owner**: Senior Engineering Team
**Tags**: architecture, progress-tracking, agent-native, tools

## Executive Summary

This document captures the architectural decision to implement a Universal Progress Tool for centralized user progress tracking across all components and modules. This aligns with our agent-native architecture principles and enables sophisticated progress-based orchestration.

## Problem Statement

Currently, progress tracking is scattered across components with inconsistent patterns:
- Legacy components use Firebase directly with custom progress logic
- No unified interface for agents to query/update progress
- Difficult to implement cross-component progress decisions
- Progress data is not standardized for agent consumption

## Architectural Decision

**Decision**: Implement Universal Progress Tool as the single source of truth for user progress tracking.

**Rationale**:
1. **Agent-Native Compliance**: Enables uniform progress queries/updates for agent orchestration
2. **Dynamic Composition Ready**: Supports future agent-composed layouts with consistent progress APIs
3. **Tool Architecture Alignment**: Progress is a cross-cutting concern that fits the reusable tool pattern
4. **Consistency & DRY**: Eliminates duplicate tracking logic and provides standardized progress semantics

## Core Principles

- **Simple Core, Rich Extensions**: Basic 0-100% progress with extensible metadata
- **Event-Driven**: Components emit progress events, tool handles persistence
- **Agent-Queryable**: Agents can get progress state for orchestration decisions
- **Context-Aware**: Progress tied to module context for multi-tenant support
- **Schema-Driven**: Progress state included in component schemas for UI rendering

## Terminology Clarification

**Important**: The term "modules" in our existing database schema refers to specific training modules within a course. To avoid confusion, we need to establish clear terminology:

- **Training Modules**: Individual lessons/units within a course (existing usage)
- **Context Components**: Collection of UI components attached to a Nav Option
- **Content Types**: Different types of trackable content (video, quiz, reading, etc.)

**Schema Decision**: Move from `modules.user_progress` to `core.user_progress`
- **Rationale**: Core platform functionality, avoids training module terminology confusion
- **Available schemas**: `core`, `analytics`, `audit`, `modules` confirmed in database
- **Choice**: `core.user_progress` for universal platform progress tracking

## Technical Interface Specification

### Core Progress Event Interface

```typescript
export interface ProgressEvent {
  userId: string;
  contentId: string;
  contextKey: string;
  progressType: 'video' | 'worksheet' | 'quiz' | 'reading' | 'course' | 'custom';
  value: number; // 0-100 percentage or custom metric
  metadata?: {
    // Video-specific
    watchTimeSeconds?: number;
    lastPositionSeconds?: number;
    videoDurationSeconds?: number;

    // Worksheet/Quiz-specific
    questionsAnswered?: number;
    totalQuestions?: number;
    score?: number;

    // Custom component data
    [key: string]: any;
  };
  timestamp: string;
}
```

### Enhanced Universal Progress Tool Interface

```typescript
export interface UniversalProgressTool {
  // Core progress tracking
  trackProgressEvent(event: ProgressEvent): Promise<void>;

  // Existing methods (maintained for compatibility)
  getProgress(userId: string, contentId: string, contextKey: string): Promise<UserProgress | null>;
  setProgress(userId: string, contentId: string, contextKey: string, progress: Partial<UserProgress>): Promise<UserProgress>;

  // Enhanced batch operations
  getProgressForContentBatch(userId: string, contentIds: string[], contextKey: string): Promise<Record<string, UserProgress>>;

  // Agent orchestration methods
  getProgressSummary(userId: string, contextKey: string): Promise<ProgressSummary>;
  getCompletionStats(userId: string, contextKey: string): Promise<CompletionStats>;

  // Milestone detection
  checkMilestones(userId: string, contextKey: string): Promise<Milestone[]>;
}
```

## Appendix: Implementation Plan

### Phase 1: Foundation Enhancement (Week 1)

**Goal**: Extend existing UserProgressTool with universal capabilities

**Tasks**:
1. **Extend UserProgressTool Interface**
   - Add `ProgressEvent` interface to `packages/agent-core/tools/UserProgressTool.ts`
   - Add `trackProgressEvent()` method
   - Add batch and summary methods
   - Maintain backward compatibility with existing interface

2. **Database Schema Enhancement**
   - **Existing structure analysis**: `modules.user_progress` has excellent foundation with rich features
   - **Schema migration**: Create `core.user_progress` based on existing structure
   - **Universal enhancements**: Add `progress_type` and `metadata` JSONB columns
   - **Preserve excellence**: Maintain all existing features (sync, notes, timestamps, indexes)
   - **No data migration**: Current table is empty per requirements
   - **Features to preserve**: Excellent indexing strategy, RLS policies, sync capabilities

3. **Enhanced Repository Implementation**
   - Extend `SupabaseUserProgressRepository` with new methods
   - Implement efficient batch operations for multiple content types
   - Add progress event logging
   - Add caching layer for frequently accessed data
   - Update repository to work with new universal schema

**Files to Modify**:
- `packages/agent-core/tools/UserProgressTool.ts`
- `create_universal_progress_table.sql` (new table creation script)
- Repository implementation

**Key Discovery**: Existing `modules.user_progress` table has **exceptional design** with:
- Rich progress tracking (sessions, completion counts, notes)
- Excellent indexing strategy (including partial indexes)
- Built-in sync capabilities
- Proper RLS policies
- Automatic timestamp triggers
- Performance-optimized for production use

### Phase 2: Universal Progress Tool Implementation & Testing (Week 2)

**Goal**: Implement and validate Universal Progress Tool functionality with Leadership Library use cases

**Tasks**:
1. **UserProgressTool Enhancement**
   - Implement all new Universal Progress Tool methods
   - Add comprehensive error handling and validation
   - Implement progress event batching for performance
   - Add progress analytics and milestone detection

2. **Hook Development**
   - Create `useUniversalProgress` hook for general progress tracking
   - Enhance existing progress hooks to use Universal Progress Tool
   - Implement real-time progress synchronization
   - Add optimistic updates for better UX

3. **Testing & Validation**
   - Unit tests for all Universal Progress Tool methods
   - Integration tests with database layer
   - Performance testing with batch operations
   - Test progress persistence across sessions
   - Validate different content types (video, quiz, reading, etc.)

**Files to Modify**:
- `packages/agent-core/tools/UserProgressTool.ts`
- `apps/web/app/hooks/useVideoProgress.ts` (enhance existing)
- Create `apps/web/app/hooks/useUniversalProgress.ts`
- Test files for comprehensive coverage

### Phase 3: Agent Integration (Week 3)

**Goal**: Enable agents to query and use progress data for orchestration

**Tasks**:
1. **Agent Tool Registration**
   - Register Universal Progress Tool in agent tool registry
   - Create agent-facing progress query methods
   - Implement progress-based decision making

2. **Schema Integration**
   - Include progress state in component schemas
   - Enable agents to include progress in UI composition
   - Add progress-based conditional rendering

3. **Analytics & Insights**
   - Implement progress analytics collection
   - Create progress milestone detection
   - Add progress-based recommendations

**Files to Modify**:
- `packages/agent-core/tools/ToolRegistry.ts`
- Agent configuration files
- Component schema definitions

## Success Criteria

### Phase 1 Success Metrics
- [ ] Universal Progress Tool interface fully implemented
- [ ] Database schema updated with new columns
- [ ] Repository supports all new methods
- [ ] Backward compatibility maintained
- [ ] Performance benchmarks meet requirements

### Phase 2 Success Metrics (Universal Progress Tool Implementation)
- [ ] All Universal Progress Tool methods fully implemented
- [ ] Comprehensive test coverage (unit + integration)
- [ ] Performance benchmarks meet requirements for batch operations
- [ ] Progress tracking works for multiple content types
- [ ] Real-time progress synchronization functional
- [ ] Error handling and edge cases covered
- [ ] Documentation complete for new hooks and methods

### Phase 3 Success Metrics
- [x] Agents can query progress for all users/content
- [x] Progress state included in component schemas
- [x] Agent-driven progress-based UI decisions working
- [x] Analytics pipeline capturing progress events
- [x] Milestone detection functional

### Overall Success Criteria
- [x] Single source of truth for all progress data
- [x] Consistent progress API across all components
- [x] Agent orchestration using progress data
- [x] Performance meets or exceeds current system
- [x] Zero data loss during migration
- [x] Documentation updated and complete