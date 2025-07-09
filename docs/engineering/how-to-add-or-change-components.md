# How to Add or Change UI Components (Agent-Native Architecture)

This guide explains how to add or change the building blocks of the LeaderForge user interface in our **agent-native architecture**. Components are schema-driven widgets that agents compose dynamically to create user experiences.

---

## 🏗️ Architectural Overview

### Agent-Native Principles
- **Agent Orchestration**: All business logic and UI composition is handled by agents, not hardcoded in frontend or API routes
- **Schema-Driven UI**: Frontend renders only what agents describe in their returned schemas
- **Widget Registry**: Components are registered and discovered dynamically, not imported directly
- **Universal Schema**: All components follow the Universal Widget Schema format for consistency

### System Components
1. **Agents**: Orchestrate business logic and return UI schemas (`'langgraph'`, `'direct'`, `'mockup'`, `'functional'`)
2. **Widgets**: Reusable UI components registered in the widget registry
3. **Schemas**: Universal format describing what widgets to render and how
4. **Dispatchers**: Route schemas to appropriate widget implementations

---

## 📋 Universal Widget Schema Format

All components must follow this standardized format:

```typescript
interface UniversalWidgetSchema {
  type: string;           // Widget type (e.g., 'Card', 'Grid', 'PromptContext')
  id: string;             // Unique identifier for this widget instance
  data: {                 // Widget data and content
    source: string;       // Data source ('static', 'agent', 'database')
    staticContent?: any;  // Static content when source is 'static'
    // ... other data properties
  };
  config: {               // Widget configuration and styling
    title?: string;       // Widget title
    // ... other config properties
  };
  version: string;        // Schema version (e.g., '1.0.0')
  fallback?: {            // Fallback widget if this type is unavailable
    type: string;
    config: any;
    errorDisplay: string;
    message: string;
  };
}
```

---

## 🔧 How to Add a New Widget

### 1. Define the Widget Interface

Create or update the widget interface in `packages/agent-core/types/`:

```typescript
// Example: New ChartWidget interface
export interface ChartWidgetSchema extends UniversalWidgetSchema {
  type: 'Chart';
  data: {
    source: 'static' | 'agent' | 'database';
    staticContent?: {
      chartType: 'bar' | 'line' | 'pie';
      data: ChartDataPoint[];
      labels: string[];
    };
  };
  config: {
    title: string;
    subtitle?: string;
    theme?: 'light' | 'dark';
    responsive?: boolean;
  };
}
```

### 2. Create the Widget Component

Implement the React component in `apps/web/components/widgets/`:

```typescript
// File: apps/web/components/widgets/ChartWidget.tsx
// Purpose: Renders interactive charts based on Universal Widget Schema
// Owner: Frontend Team
// Tags: widgets, charts, data-visualization

import React from 'react';
import { ChartWidgetSchema } from '../../../../packages/agent-core/types';

interface ChartWidgetProps {
  schema: ChartWidgetSchema;
  userId?: string;
  tenantKey?: string;
  onAction?: (action: any) => void;
}

export function ChartWidget({ schema, userId, tenantKey, onAction }: ChartWidgetProps) {
  const { data, config } = schema;

  // Render chart based on schema configuration
  return (
    <div className="chart-widget">
      <h3>{config.title}</h3>
      {/* Chart implementation */}
    </div>
  );
}
```

### 3. Register the Widget

Add the widget to the registry in `apps/web/components/widgets/index.ts`:

```typescript
// Register new widget type
export { ChartWidget } from './ChartWidget';

// Update widget registry mapping
export const WIDGET_TYPE_MAP = {
  // ... existing widgets
  Chart: ChartWidget,
} as const;
```

### 4. Update Widget Dispatcher

The `WidgetDispatcher` should automatically pick up registered widgets, but verify in `apps/web/components/widgets/WidgetDispatcher.tsx`:

```typescript
// Widget dispatcher automatically handles registered types
export function isWidgetTypeAvailable(type: string): boolean {
  return type in WIDGET_TYPE_MAP;
}
```

### 5. Create Agent Schema Template

Agents need schema templates to generate the new widget. Add to agent configuration:

```typescript
// Agent configuration for returning Chart widgets
const chartTemplate: ChartWidgetSchema = {
  type: 'Chart',
  id: `chart-${Date.now()}`,
  data: {
    source: 'static',
    staticContent: {
      chartType: 'bar',
      data: [], // Populated by agent
      labels: [] // Populated by agent
    }
  },
  config: {
    title: 'Data Visualization',
    theme: 'light',
    responsive: true
  },
  version: '1.0.0'
};
```

### 6. Test with Agent

Update an agent (LangGraph, mockup, or functional) to return the new widget schema:

```typescript
// Example: Agent returning chart widget
return {
  type: 'content_schema',
  content: {
    type: 'Grid',
    id: 'dashboard-grid',
    data: {
      source: 'agent',
      items: [
        chartTemplate, // Your new chart widget
        // ... other widgets
      ]
    },
    config: { title: 'Dashboard' },
    version: '1.0'
  }
};
```

---

## 🔄 How to Modify Existing Widgets

### 1. Update the Schema Interface

Modify the widget interface in `packages/agent-core/types/`:

```typescript
// Example: Adding new field to existing CardWidget
export interface CardWidgetSchema extends UniversalWidgetSchema {
  type: 'Card';
  data: {
    // ... existing fields
    author?: string; // NEW: Author field
  };
  config: {
    // ... existing fields
    showAuthor?: boolean; // NEW: Toggle author display
  };
}
```

### 2. Update the Widget Component

Modify the React component to handle the new schema fields:

```typescript
// In CardWidget.tsx
export function CardWidget({ schema }: CardWidgetProps) {
  const { data, config } = schema;

  return (
    <div className="card-widget">
      {/* ... existing content */}
      {config.showAuthor && data.author && (
        <div className="card-author">By: {data.author}</div>
      )}
    </div>
  );
}
```

### 3. Update Agent Templates

Modify agent configurations to use the new schema fields:

```typescript
// Update agent template to include new fields
const cardTemplate = {
  type: 'Card',
  data: {
    // ... existing data
    author: 'John Doe' // NEW: Include author
  },
  config: {
    // ... existing config
    showAuthor: true // NEW: Enable author display
  }
};
```

---

## 🚀 Agent Types and Use Cases

### LangGraph Agents (`'langgraph'`)
- **Purpose**: Complex AI workflows and dynamic content generation
- **Use Case**: Leadership Library, dynamic learning paths
- **Response Time**: 8-13 seconds
- **Schema**: Returns complex widget compositions

### Direct Agents (`'direct'`)
- **Purpose**: Instant navigation to existing pages
- **Use Case**: Settings pages, static content
- **Response Time**: 0ms (immediate navigation)
- **Schema**: Returns route information

### Mockup Agents (`'mockup'`)
- **Purpose**: Prototype and demo components
- **Use Case**: Stakeholder reviews, UI validation
- **Response Time**: Instant
- **Schema**: Returns mockup component references

### Functional Agents (`'functional'`)
- **Purpose**: Server-side business logic
- **Use Case**: Form processing, data validation
- **Response Time**: Fast (< 1 second)
- **Schema**: Returns processed data widgets

---

## 📁 File Structure

```
packages/agent-core/types/
├── UniversalWidgetSchema.ts    # Base schema interface
├── ComponentSchema.ts          # Legacy (being phased out)
└── widgets/
    ├── CardWidgetSchema.ts     # Card widget types
    ├── GridWidgetSchema.ts     # Grid widget types
    └── ChartWidgetSchema.ts    # Chart widget types

apps/web/components/
├── widgets/
│   ├── index.ts               # Widget registry
│   ├── WidgetDispatcher.tsx   # Schema routing
│   ├── CardWidget.tsx         # Card implementation
│   ├── GridWidget.tsx         # Grid implementation
│   └── ChartWidget.tsx        # Chart implementation
└── ai/
    └── UniversalSchemaRenderer.tsx # Main renderer
```

---

## ✅ Development Workflow

### For New Features:
1. **Design Schema First**: Define the Universal Widget Schema interface
2. **Implement Widget**: Create the React component following schema
3. **Register Widget**: Add to widget registry and dispatcher
4. **Configure Agent**: Update agent to return new widget schemas
5. **Test End-to-End**: Verify agent → schema → widget rendering

### For Modifications:
1. **Update Schema**: Modify the widget interface
2. **Update Component**: Implement new schema fields
3. **Update Agents**: Modify agent templates to use new fields
4. **Test Backwards Compatibility**: Ensure existing schemas still work

### Quality Checklist:
- [ ] ✅ **Schema Compliance**: Uses Universal Widget Schema format
- [ ] ✅ **Agent Integration**: Can be generated by agents
- [ ] ✅ **Registry Registration**: Added to widget registry
- [ ] ✅ **Fallback Handling**: Graceful degradation for errors
- [ ] ✅ **Documentation**: Header comments with Purpose, Owner, Tags
- [ ] ✅ **Testing**: Works with multiple agent types

---

## 🛠️ Advanced Patterns

### Conditional Rendering
```typescript
// Schema-driven conditional rendering
const widgetSchema = {
  type: 'Card',
  data: {
    showAdvanced: user.hasPermission('advanced'),
    content: user.hasPermission('advanced') ? advancedContent : basicContent
  }
};
```

### Widget Composition
```typescript
// Agents compose multiple widgets
const dashboardSchema = {
  type: 'Grid',
  data: {
    items: [
      { type: 'Chart', /* ... */ },
      { type: 'Card', /* ... */ },
      { type: 'StatCard', /* ... */ }
    ]
  }
};
```

### Dynamic Actions
```typescript
// Widgets can trigger actions back to agents
const actionableWidget = {
  type: 'Card',
  config: {
    actions: [
      {
        label: 'Refresh Data',
        action: 'refresh',
        parameters: { source: 'database' }
      }
    ]
  }
};
```

---

## 🎯 Best Practices

1. **Agent-First Design**: Always think about how agents will generate your widget schemas
2. **Schema Validation**: Ensure all required Universal Widget Schema fields are present
3. **Graceful Fallbacks**: Handle missing data and configuration gracefully
4. **Performance**: Use React.memo and useMemo for expensive operations
5. **Accessibility**: Follow WCAG guidelines for all widget components
6. **Responsive Design**: Ensure widgets work across all device sizes
7. **Error Boundaries**: Implement error handling for widget failures

---

## 🔍 Debugging Guide

### Common Issues:
- **Widget Not Rendering**: Check widget registry registration
- **Schema Validation Errors**: Verify Universal Widget Schema format
- **Agent Not Returning Widget**: Check agent configuration and templates
- **Styling Issues**: Ensure CSS follows established theme patterns

### Debug Tools:
- Browser DevTools: Inspect rendered schemas
- Agent Logs: Check LangSmith for agent execution
- Widget Registry: Verify widget type availability
- Schema Validation: Use TypeScript for compile-time checks

---

**Remember**: In our agent-native architecture, widgets are building blocks that agents compose dynamically. Focus on creating flexible, schema-driven components that agents can orchestrate to create rich user experiences.