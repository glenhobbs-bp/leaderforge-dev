# Agent-Native Composition Directory Structure

**File:** docs/architecture/directory-structure.md
**Purpose:** Defines the complete directory structure for agent-native composition architecture
**Owner:** Senior Architect
**Tags:** #architecture #directory-structure #widgets #composition

## Overview

This document defines the directory structure for the refactored agent-native composition system, focusing on extracting the 963-line ComponentSchemaRenderer into modular, discoverable widgets.

## Core Architecture Principles

- **Widget Modularity**: Each UI component type becomes a self-contained widget
- **Agent Discovery**: All assets (widgets, tools, compositions) are discoverable by agents
- **Type Safety**: Strong TypeScript interfaces throughout
- **Development Independence**: Teams can work on widgets/tools independently

## Directory Structure

### Root Structure
```
leaderforge-dev/
├── packages/
│   ├── asset-core/           # Asset system foundation
│   ├── agent-core/           # Existing agent infrastructure
│   └── env/                  # Environment config
├── apps/
│   └── web/
│       ├── app/              # Next.js App Router
│       ├── components/       # React components
│       └── lib/              # Utilities and services
└── docs/                     # Documentation
```

### Asset System Core (`packages/asset-core/`)
```
packages/asset-core/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Main exports
│   ├── registries/
│   │   ├── AssetRegistry.ts        # Base registry class
│   │   ├── WidgetRegistry.ts       # UI widget registry
│   │   ├── ToolRegistry.ts         # Backend tool registry
│   │   ├── CompositionRegistry.ts  # User composition registry
│   │   └── AssetDiscovery.ts       # Unified discovery service
│   ├── types/
│   │   ├── WidgetSchema.ts         # Widget type definitions
│   │   ├── ToolSchema.ts           # Tool type definitions
│   │   ├── CompositionSchema.ts    # Composition type definitions
│   │   └── AssetMetadata.ts        # Common asset metadata
│   ├── validation/
│   │   ├── SchemaValidator.ts      # Schema validation utilities
│   │   └── TypeGuards.ts           # Runtime type checking
│   └── utils/
│       ├── AssetLoader.ts          # Dynamic asset loading
│       └── CacheManager.ts         # Asset caching utilities
```

### Widget System (`apps/web/components/widgets/`)
```
apps/web/components/widgets/
├── index.ts                        # Widget registry exports
├── base/
│   ├── BaseWidget.tsx              # Base widget component
│   ├── WidgetProps.ts              # Common widget prop types
│   └── WidgetActions.ts            # Widget action handlers
├── content/
│   ├── Card/
│   │   ├── Card.tsx                # Extracted from ComponentSchemaRenderer
│   │   ├── Card.types.ts           # Card-specific types
│   │   ├── Card.actions.ts         # Card action handlers
│   │   └── Card.test.tsx           # Card component tests
│   ├── VideoPlayer/
│   │   ├── VideoPlayer.tsx         # Extracted video player widget
│   │   ├── VideoPlayerModal.tsx    # Modal implementation
│   │   ├── VideoPlayer.types.ts    # Video player types
│   │   ├── VideoPlayer.actions.ts  # Video player actions
│   │   └── VideoPlayer.test.tsx    # Video player tests
│   └── Grid/
│       ├── Grid.tsx                # Grid layout widget
│       ├── Grid.types.ts           # Grid-specific types
│       └── Grid.test.tsx           # Grid component tests
├── layout/
│   ├── Panel/
│   │   ├── Panel.tsx               # Panel layout widget
│   │   ├── Panel.types.ts          # Panel types
│   │   └── Panel.test.tsx          # Panel tests
│   └── ThreePanelLayout/
│       ├── ThreePanelLayout.tsx    # Main layout widget
│       └── ThreePanelLayout.types.ts
├── data/
│   ├── StatCard/
│   │   ├── StatCard.tsx            # Statistics display widget
│   │   ├── StatCard.types.ts       # StatCard types
│   │   └── StatCard.test.tsx       # StatCard tests
│   ├── Leaderboard/
│   │   ├── Leaderboard.tsx         # Leaderboard widget
│   │   ├── Leaderboard.types.ts    # Leaderboard types
│   │   └── Leaderboard.test.tsx    # Leaderboard tests
│   └── VideoList/
│       ├── VideoList.tsx           # Video list widget
│       ├── VideoList.types.ts      # VideoList types
│       └── VideoList.test.tsx      # VideoList tests
└── registry/
    ├── WidgetDefinitions.ts        # Widget metadata definitions
    ├── WidgetRegistration.ts       # Widget registration logic
    └── DefaultWidgets.ts           # Default widget set
```

### Refactored Renderer (`apps/web/components/ai/`)
```
apps/web/components/ai/
├── ComponentSchemaRenderer.tsx     # REFACTORED: Thin widget dispatcher
├── ErrorWidget.tsx                # Error handling widget
├── WidgetLoader.tsx               # Dynamic widget loading
├── CompositionRenderer.tsx        # User composition rendering
└── tests/
    ├── ComponentSchemaRenderer.test.tsx  # Renderer tests
    └── WidgetIntegration.test.tsx        # Widget integration tests
```

### Updated API Structure (`apps/web/app/api/`)
```
apps/web/app/api/
├── assets/                        # Asset management endpoints
│   ├── registry/
│   │   ├── widgets/
│   │   │   └── route.ts           # Widget discovery API
│   │   ├── tools/
│   │   │   └── route.ts           # Tool discovery API
│   │   └── compositions/
│   │       └── route.ts           # Composition API
│   ├── discovery/
│   │   └── route.ts               # Unified asset discovery
│   └── validation/
│       └── route.ts               # Schema validation API
├── agent/                         # Existing agent endpoints
├── content/                       # Content management
└── user/                          # User management
```

## Widget Extraction Strategy

### Phase 1: Foundation (Hours 1-8)
1. **Create `packages/asset-core/` structure**
2. **Set up widget registry infrastructure**
3. **Define base widget interfaces**

### Phase 2: Widget Extraction (Hours 9-24)
Extract widgets in order of complexity:

1. **Simple Widgets First**:
   ```
   StatCard → Leaderboard → VideoList
   ```

2. **Complex Widgets**:
   ```
   Panel → Grid → Card
   ```

3. **Most Complex**:
   ```
   VideoPlayer (with HLS, progress tracking, modal)
   ```

### Phase 3: Renderer Refactor (Hours 25-32)
1. **Replace ComponentSchemaRenderer switch statement**
2. **Implement widget discovery and loading**
3. **Add error handling for missing widgets**

## Widget Registration Pattern

### Widget Definition
```typescript
// apps/web/components/widgets/content/Card/Card.tsx
import { BaseWidget, WidgetProps } from '../../base/BaseWidget';
import { CardSchema } from './Card.types';

export interface CardProps extends WidgetProps {
  schema: CardSchema;
}

export function Card({ schema, userId, onAction }: CardProps) {
  // Widget implementation
}

// Widget metadata for registry
export const CardWidgetDefinition = {
  type: 'Card',
  component: Card,
  schema: CardSchema,
  capabilities: ['video-playback', 'progress-tracking'],
  dependencies: ['video-player-modal'],
  version: '1.0.0'
};
```

### Registry Integration
```typescript
// apps/web/components/widgets/registry/DefaultWidgets.ts
import { CardWidgetDefinition } from '../content/Card/Card';
import { VideoPlayerWidgetDefinition } from '../content/VideoPlayer/VideoPlayer';

export const DefaultWidgets = [
  CardWidgetDefinition,
  VideoPlayerWidgetDefinition,
  // ... other widgets
];
```

### Refactored Renderer
```typescript
// apps/web/components/ai/ComponentSchemaRenderer.tsx
import { WidgetRegistry } from '../widgets/registry/WidgetRegistration';

export function ComponentSchemaRenderer({ schema, userId }: ComponentSchemaRendererProps) {
  const widget = WidgetRegistry.getWidget(schema.type);

  if (!widget) {
    return <ErrorWidget type={schema.type} availableTypes={WidgetRegistry.getAvailableTypes()} />;
  }

  const Component = widget.component;
  return (
    <Component
      schema={schema}
      userId={userId}
      onAction={widget.actionHandler}
    />
  );
}
```

## Testing Strategy

### Widget-Level Testing
```
components/widgets/content/Card/Card.test.tsx
- Unit tests for Card widget
- Mock data and user interactions
- Progress tracking validation
```

### Integration Testing
```
components/ai/tests/WidgetIntegration.test.tsx
- Test ComponentSchemaRenderer with all widget types
- Schema validation testing
- Error handling testing
```

### Registry Testing
```
packages/asset-core/src/registries/__tests__/
- Widget registration/discovery testing
- Performance testing for asset lookup
- Type safety validation
```

## Migration Benefits

### Before (Current)
- ✅ Single file: `ComponentSchemaRenderer.tsx` (963 lines)
- ❌ Hard to test individual components
- ❌ No agent discoverability
- ❌ Difficult to add new widget types
- ❌ Complex maintenance as widgets grow

### After (Target)
- ✅ Modular widgets: ~50-100 lines each
- ✅ Individual widget testing
- ✅ Agent-discoverable widget registry
- ✅ Easy to add new widgets
- ✅ Independent widget development
- ✅ Type-safe widget interfaces

## Development Workflow

### Adding New Widgets
1. **Create widget directory**: `components/widgets/category/WidgetName/`
2. **Implement widget component**: Following BaseWidget interface
3. **Define widget metadata**: Types, capabilities, dependencies
4. **Register widget**: Add to registry definitions
5. **Add tests**: Widget unit tests and integration tests
6. **Update documentation**: Widget capabilities and usage

### Widget Development Guidelines
- Each widget is self-contained
- Follow TypeScript strict mode
- Include comprehensive prop types
- Implement error boundaries
- Add accessibility attributes
- Follow design system tokens

## Performance Considerations

### Widget Loading
- **Dynamic imports**: Widgets loaded on-demand
- **Registry caching**: Widget metadata cached in memory
- **Bundle splitting**: Each widget can be code-split
- **Asset preloading**: Critical widgets preloaded

### Agent Discovery
- **Registry indexing**: Fast widget lookup by type/capability
- **Schema validation**: Cached validation results
- **Performance SLA**: <50ms widget discovery, <100ms widget loading

---

**Next Steps**: This directory structure will be implemented as part of the Asset System Refactor Plan, with ComponentSchemaRenderer extraction as the primary focus.