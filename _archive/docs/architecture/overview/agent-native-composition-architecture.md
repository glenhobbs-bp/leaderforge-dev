# Agent-Native Composition Architecture

**File:** docs/agent-native-composition-architecture.md
**Purpose:** Defines the architectural principles and patterns for agent-native UI composition system
**Owner:** Senior Architect
**Tags:** architecture, components, agents, composition, schema

## Core Principles

### Agent-Native Application (ANA) Foundation
- **Agents orchestrate everything**: All UI composition decisions made by agents
- **Schema-driven rendering**: Frontend renders only what agents describe via schema
- **Dynamic composition**: Compositions created and modified at runtime by agents
- **No hardcoded UI logic**: All UI behavior comes from agent-generated schemas

### Modular Monolith Architecture
- **Single codebase**: All components in one repository for easy development
- **Modular organization**: Clear boundaries between component types and responsibilities
- **Registry-based discovery**: Components self-register for agent discovery
- **Independent development**: Components can be developed and tested in isolation

## Composition System Overview

### Core Concepts

#### 1. Base Components
Atomic, reusable UI building blocks that agents can compose:
```typescript
// Examples of base components
- Card: Display content with actions
- Grid: Layout multiple items
- VideoPlayer: Media playback with progress tracking
- StatCard: Metric display
- Leaderboard: Ranked list display
```

#### 2. Compositions
Agent-orchestrated combinations of base components that create user experiences:
```typescript
// Examples of compositions
- ContentLibrary: Grid of Cards with filtering
- Dashboard: Multiple StatCards and Grids
- LearningPath: Sequential Cards with progress
- VideoWorkshop: VideoPlayer + related Cards
```

#### 3. Universal Schema
Standard format that agents use to describe compositions:
```typescript
interface CompositionSchema {
  type: string;
  props: Record<string, any>;
  children?: CompositionSchema[];
  metadata?: {
    componentId: string;
    version: string;
    capabilities: string[];
  };
}
```

#### 4. Component Registry
Central system for component discovery and instantiation:
```typescript
interface ComponentRegistry {
  register(component: ComponentDefinition): void;
  discover(capabilities: string[]): ComponentDefinition[];
  instantiate(schema: CompositionSchema): JSX.Element;
  getSchema(componentId: string): JSONSchema;
}
```

## Architecture Layers

### 1. Agent Layer
- **Composition Orchestration**: Agents decide what components to use
- **Schema Generation**: Agents generate valid composition schemas
- **Dynamic Adaptation**: Agents modify compositions based on user interactions
- **Context Awareness**: Agents consider user state, preferences, and capabilities

### 2. Registry Layer
- **Component Discovery**: Provides agents with available components
- **Schema Validation**: Ensures compositions follow universal schema
- **Capability Matching**: Matches agent requirements with component capabilities
- **Version Management**: Handles component versioning and compatibility

### 3. Component Layer
- **Base Components**: Atomic, reusable UI elements
- **Composition Renderer**: Interprets schemas and renders components
- **State Management**: Handles component-level state and interactions
- **Event Propagation**: Communicates user actions back to agents

### 4. Infrastructure Layer
- **CopilotKit Integration**: Chat interface for composition modification
- **Progress Tracking**: Universal progress system across compositions
- **Authentication**: Consistent auth patterns across all components
- **Data Services**: Standardized data access for all components

## Directory Structure

```
packages/agent-core/
├── compositions/
│   ├── registry/
│   │   ├── ComponentRegistry.ts           # Central registry implementation
│   │   ├── types.ts                       # Registry type definitions
│   │   └── validators.ts                  # Schema validation
│   ├── base/
│   │   ├── Card/
│   │   │   ├── Card.tsx                   # Component implementation
│   │   │   ├── Card.test.tsx             # Component tests
│   │   │   ├── Card.schema.json          # Agent-discoverable schema
│   │   │   └── index.ts                  # Export and registration
│   │   ├── Grid/
│   │   ├── VideoPlayer/
│   │   └── StatCard/
│   ├── compositions/
│   │   ├── ContentLibrary/
│   │   │   ├── ContentLibrary.composition.ts
│   │   │   └── ContentLibrary.schema.json
│   │   └── Dashboard/
│   ├── renderer/
│   │   ├── CompositionRenderer.tsx       # Main renderer
│   │   ├── SchemaValidator.ts            # Runtime validation
│   │   └── ErrorBoundary.tsx             # Error handling
│   └── schemas/
│       ├── UniversalSchema.ts            # Base schema definitions
│       ├── ComponentSchema.ts            # Component-specific schemas
│       └── CompositionSchema.ts          # Composition schemas

apps/web/components/
├── ai/
│   ├── CompositionRenderer.tsx           # Main app renderer (thin wrapper)
│   └── AgentInterface.tsx                # CopilotKit integration
└── ui/
    └── legacy/                           # Legacy components (to be migrated)
```

## Component Development Patterns

### Base Component Pattern
```typescript
// Base component structure
interface CardProps {
  title: string;
  description?: string;
  image?: string;
  actions?: CardAction[];
  // ... other props
}

export function Card({ title, description, image, actions }: CardProps) {
  // Component implementation
}

// Schema definition for agents
export const CardSchema: ComponentDefinition = {
  id: 'base.card',
  name: 'Card',
  description: 'Display content with optional actions',
  version: '1.0.0',
  capabilities: ['content-display', 'user-actions', 'progress-tracking'],
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string', required: true },
      description: { type: 'string' },
      image: { type: 'string', format: 'uri' },
      actions: { type: 'array', items: { $ref: '#/definitions/CardAction' } }
    }
  }
};

// Auto-registration
ComponentRegistry.register(CardSchema, Card);
```

### Composition Pattern
```typescript
// Composition definition for agents
export const ContentLibraryComposition: CompositionDefinition = {
  id: 'composition.content-library',
  name: 'Content Library',
  description: 'Displays content in a searchable, filterable grid',
  requiredCapabilities: ['content-display', 'filtering', 'search'],
  baseComponents: ['base.grid', 'base.card', 'base.search-bar'],
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      items: { type: 'array', items: { $ref: '#/base/card' } },
      filters: { type: 'array', items: { $ref: '#/base/filter' } }
    }
  }
};
```

## Agent Integration Patterns

### Schema Generation
```typescript
// Agent generates composition schema
async function generateContentLibrarySchema(
  userContext: UserContext,
  contentItems: ContentItem[]
): Promise<CompositionSchema> {
  const availableComponents = ComponentRegistry.discover(['content-display']);

  return {
    type: 'Grid',
    props: {
      title: `${userContext.module} Content Library`,
      items: contentItems.map(item => ({
        type: 'Card',
        props: {
          title: item.title,
          description: item.description,
          image: item.thumbnail,
          actions: [
            { action: 'openVideoModal', label: 'Watch', videoUrl: item.videoUrl }
          ]
        }
      }))
    }
  };
}
```

### Dynamic Modification
```typescript
// Agent modifies composition based on user interaction
async function handleUserFeedback(
  currentComposition: CompositionSchema,
  feedback: string
): Promise<CompositionSchema> {
  // Agent analyzes feedback and modifies composition
  const modifications = await analyzeUserFeedback(feedback);
  return applyModifications(currentComposition, modifications);
}
```

## CopilotKit Integration

### Chat-Driven Composition
```typescript
// Enable composition modification via chat
function useCopilotComposition() {
  const { sendMessage } = useCopilotChat();

  const modifyComposition = async (request: string) => {
    const response = await sendMessage({
      content: `Modify the current composition: ${request}`,
      intent: 'composition_modification'
    });

    // Agent returns new composition schema
    return response.compositionSchema;
  };

  return { modifyComposition };
}
```

## Migration Strategy

### Phase 1: Foundation (Week 1-2)
- Create component registry infrastructure
- Define universal schema system
- Build composition renderer
- Migrate 2-3 base components

### Phase 2: Core Components (Week 3-4)
- Migrate all existing components to registry
- Implement agent discovery system
- Add schema validation
- Update agents to use registry

### Phase 3: Dynamic Composition (Week 5-6)
- Enable runtime composition modification
- Integrate with CopilotKit
- Add composition templates
- Implement user preference learning

### Phase 4: Advanced Features (Week 7-8)
- Component versioning system
- A/B testing for compositions
- Performance optimization
- Advanced agent capabilities

## Quality Gates

### Component Registration
- [ ] Schema defined and validated
- [ ] Component registered in registry
- [ ] Tests covering all props/states
- [ ] Documentation with examples
- [ ] Agent integration verified

### Composition Development
- [ ] Uses only registered components
- [ ] Schema validates against universal format
- [ ] Handles all user interaction patterns
- [ ] Responsive design implemented
- [ ] Accessibility requirements met

### Agent Integration
- [ ] Discovers components via registry
- [ ] Generates valid schemas
- [ ] Handles composition errors gracefully
- [ ] Supports dynamic modification
- [ ] Tracks user engagement metrics

## Success Metrics

### Technical Metrics
- Component registry coverage: >95% of UI elements
- Schema validation success rate: >99%
- Composition render performance: <100ms
- Agent discovery latency: <50ms

### User Experience Metrics
- Composition load time: <2s
- Chat modification success rate: >90%
- User engagement with dynamic compositions: +30%
- Developer velocity for new components: +50%

---

This architecture enables true agent-native composition where:
1. **Agents have full control** over UI composition decisions
2. **Components are discoverable** and reusable building blocks
3. **Users can modify** compositions through natural language
4. **Developers can add** new components without breaking existing functionality
5. **The system scales** as we add more components and compositions