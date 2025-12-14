# ADR-0009: Schema-Props Boundary Separation

**Status:** ✅ Accepted
**Date:** 2025-06-26
**Deciders:** Senior Architect, Engineering Team
**Technical Story:** Universal Schema vs Component Props Architectural Boundary

## Context

During the asset system refactor (Phases 1-2), we encountered architectural inconsistency between Universal Schema patterns and component props. The current implementation mixes schema-driven composition with props-driven component internals, creating confusion about what should be agent-controllable versus component-internal.

### Problem Statement
- Mixed schema/props patterns across widget components
- Unclear boundary between agent-controllable and component-internal concerns
- Schema duplication in component interfaces
- Risk of unwieldy schemas if everything becomes agent-controllable

### Industry Analysis
**Figma:** Schema controls component structure, props handle rendering optimizations
**Notion:** Schema defines block content/properties, props manage edit state/handlers
**Retool:** Schema configures widget data/position, props handle framework concerns

## Decision

**We will implement a **Hybrid Schema + Props Architecture** with clear boundary separation:**

### ✅ SCHEMA-DRIVEN: Agent-Controllable Composition
**What agents control through Universal Schema:**

```typescript
interface UniversalWidgetSchema {
  // 1. COMPOSITION: What widget, where it goes
  type: string;
  id: string;
  position?: PositionConfig;

  // 2. DATA: What content/data the widget displays
  data: {
    source: string;
    query?: object;
    staticContent?: unknown;
  };

  // 3. CONFIGURATION: User/agent-configurable behavior
  config: {
    title?: string;
    columns?: number;
    displayMode?: 'grid' | 'list' | 'carousel';
    interactions?: InteractionConfig[];
  };

  // 4. RELATIONSHIPS: How widgets communicate
  children?: UniversalWidgetSchema[];
  dataBindings?: DataBinding[];
  eventHandlers?: EventHandler[];

  // 5. METADATA: Schema management
  version: string;
  fallback?: FallbackConfig;
  metadata?: Record<string, unknown>;
}
```

### 🔧 PROPS-DRIVEN: Component Implementation Details
**What components handle internally with props:**

```typescript
interface WidgetProps {
  // 1. FRAMEWORK CONCERNS: React-specific implementation
  key?: string;
  ref?: React.Ref;
  className?: string;

  // 2. PERFORMANCE: Rendering optimizations
  virtualization?: boolean;
  lazy?: boolean;
  memoization?: boolean;

  // 3. DEVELOPMENT: Debug and development tools
  debugMode?: boolean;
  testId?: string;

  // 4. INTERNAL STATE: Component lifecycle management
  onMount?: () => void;
  onUnmount?: () => void;
  internalState?: ComponentState;

  // 5. EVENT HANDLING: Framework-specific handlers
  onAction?: (action: Action) => void;
  onProgressUpdate?: () => void;
}
```

## Architecture Pattern

### Schema-to-Props Transformation
```typescript
// Registry includes transformation function
widgetRegistry.register({
  type: 'Grid',
  component: GridComponent,
  schemaToProps: (schema: UniversalWidgetSchema): GridProps => ({
    // Extract agent-controllable properties
    columns: schema.config.columns,
    gap: schema.config.gap,
    title: schema.config.title,
    items: schema.children?.map(child => transformSchemaToProps(child)),

    // Add component-internal properties
    virtualization: true,
    debugMode: process.env.NODE_ENV === 'development',
    testId: `grid-${schema.id}`,
  })
});
```

### Component Implementation
```typescript
// Components receive transformed props, not raw schema
function GridComponent({
  columns,
  gap,
  title,
  items,
  virtualization,
  debugMode,
  testId
}: GridProps) {
  // Pure component implementation
  // No schema parsing or agent concerns
}
```

## Consequences

### Positive
✅ **Clear Separation of Concerns:** Agents control composition, components control implementation
✅ **Component Reusability:** Components work with props outside schema context
✅ **Performance:** Internal optimizations don't bloat schema
✅ **Maintainability:** Clear mental model for developers
✅ **Industry Alignment:** Follows proven patterns from Figma, Notion, Retool
✅ **Agent Discovery:** Clean schema enables dynamic widget discovery

### Negative
⚠️ **Transformation Layer:** Additional complexity in schema-to-props mapping
⚠️ **Boundary Discipline:** Requires clear guidelines on what goes where
⚠️ **Migration Effort:** Existing widgets need schema/props separation

### Risks
🔴 **Boundary Violations:** Developers might mix concerns without clear guidelines
🟡 **Performance Overhead:** Schema transformation on every render
🟡 **Type Safety:** Schema-to-props transformations need validation

## Implementation Plan

### Phase 1: Schema Standardization (4 hours)
- Update `UniversalWidgetSchema` interface
- Standardize all widget schemas
- Remove props duplication in widget interfaces

### Phase 2: Transformation Layer (2 hours)
- Implement `schemaToProps` functions in widget registry
- Update `WidgetDispatcher` to use transformations
- Add type safety for transformations

### Phase 3: Component Cleanup (2 hours)
- Remove schema parsing from components
- Standardize component props interfaces
- Add development/debugging props

## Compliance Requirements

### Schema-Driven Properties (Agent-Controllable)
- [ ] Widget type and identification
- [ ] Data sources and static content
- [ ] User-configurable display options
- [ ] Layout and positioning
- [ ] Child widget composition
- [ ] Inter-widget relationships

### Props-Driven Properties (Component-Internal)
- [ ] Framework-specific concerns (React refs, keys)
- [ ] Performance optimizations
- [ ] Development tools and debugging
- [ ] Internal state management
- [ ] Event handler implementations

### Forbidden Patterns
- ❌ Schema properties duplicated in props
- ❌ Component-internal concerns in schema
- ❌ Agent-controllable properties only in props
- ❌ Direct schema access in component implementation

## Success Metrics

- Zero schema/props duplication across all widgets
- 100% widget compatibility with transformation layer
- Agent discovery working for all registered widgets
- Component reusability outside schema context maintained
- Performance impact <5ms per widget transformation

## Related ADRs

- [ADR-0001: Agent-Native Composition System](./0001-agent-native-composition-system.md)
- [ADR-0003: Separate Asset Registries](./0003-separate-asset-registries.md)
- [ADR-0008: Pure Schema-Driven Widgets](./0008-pure-schema-driven-widgets.md)

## Examples

### Before (Mixed Pattern)
```typescript
// ❌ VIOLATION: Mixed schema and props concerns
interface GridSchema {
  type: 'Grid';
  props?: {
    title?: string;     // Agent-controllable
    columns?: number;   // Agent-controllable
  };
  title?: string;       // DUPLICATION
  className?: string;   // Component-internal
}
```

### After (Clean Separation)
```typescript
// ✅ SCHEMA: Agent-controllable only
interface GridSchema {
  type: 'Grid';
  config: {
    title?: string;
    columns: number;
    gap: 'small' | 'medium' | 'large';
  };
  children: UniversalWidgetSchema[];
}

// ✅ PROPS: Component-internal only
interface GridProps {
  title?: string;
  columns: number;
  gap: string;
  items: React.ReactNode[];
  virtualization?: boolean;
  testId?: string;
}
```

---

**Decision Rationale:** This hybrid approach provides the best balance of agent control and component performance, following industry-proven patterns while maintaining our agent-native architecture principles.