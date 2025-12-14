# How-To: Schema-Driven Widgets

## Overview

This guide covers everything you need to know about creating, registering, and using schema-driven widgets in our agent-native platform. All widgets follow the Pure Schema-Driven approach documented in [ADR-0008](../../architecture/adr/0008-pure-schema-driven-widgets.md) and the Universal Registry-Driven System principles from [ADR-0009](../../architecture/adr/0009-schema-props-boundary-separation.md).

## ⚠️ **CRITICAL PRINCIPLE**

**UniversalSchemaRenderer must NEVER be modified when adding new widgets.** New widgets must be registry-discoverable and work immediately after registration without any changes to universal components.

## Table of Contents

1. [Creating a New Widget](#creating-a-new-widget)
2. [Widget Registration](#widget-registration)
3. [Using Widgets in Agents](#using-widgets-in-agents)
4. [Schema Design Patterns](#schema-design-patterns)
5. [Testing Widgets](#testing-widgets)
6. [Troubleshooting](#troubleshooting)
7. [Appendix: Universal Schema Structure](#appendix-universal-schema-structure)

---

## Creating a New Widget

### Step 1: Define the Widget Interface

Create your widget with both legacy props and schema interfaces for backwards compatibility:

```typescript
// Example: MyWidget.tsx
"use client";

import React from 'react';

// Legacy props interface for backwards compatibility
interface MyWidgetProps {
  title: string;
  data: any[];
  theme?: 'light' | 'dark';
  onClick?: (item: any) => void;
}

// Schema interface for new schema-driven approach
interface MyWidgetSchema {
  type: 'MyWidget';
  title: string;
  data: any[];
  theme?: 'light' | 'dark';
  onClick?: (item: any) => void;
  metadata?: {
    version?: string;
    source?: string;
    fallbacks?: {
      data?: any[];
      title?: string;
    };
  };
}

// Union type for transition period
type MyWidgetInput = MyWidgetProps | { schema: MyWidgetSchema };

function isSchemaInput(input: MyWidgetInput): input is { schema: MyWidgetSchema } {
  return 'schema' in input;
}
```

### Step 2: Implement the Widget Component

```typescript
export default function MyWidget(input: MyWidgetInput) {
  // Extract props from either schema or direct props
  const props: MyWidgetProps = isSchemaInput(input)
    ? {
        title: input.schema.title,
        data: input.schema.data,
        theme: input.schema.theme,
        onClick: input.schema.onClick
      }
    : input;

  const { title, data, theme = 'light', onClick } = props;

  // Handle schema-specific features like fallbacks
  const safeData = isSchemaInput(input) && !data?.length
    ? input.schema.metadata?.fallbacks?.data || []
    : data || [];

  return (
    <div className={`card-glass-subtle p-6 ${theme === 'dark' ? 'bg-gray-800' : ''}`}>
      <h3 className="text-glass-primary text-lg font-semibold mb-4">
        {title}
      </h3>

      <div className="space-y-2">
        {safeData.map((item, index) => (
          <div
            key={index}
            className="p-3 rounded-lg hover:bg-white/20 cursor-pointer"
            onClick={() => onClick?.(item)}
          >
            {item.name || item.title || String(item)}
          </div>
        ))}
      </div>

      {safeData.length === 0 && (
        <div className="text-center py-8">
          <span className="text-glass-muted text-sm">No data available</span>
        </div>
      )}
    </div>
  );
}
```

### Step 3: Add File Header

All widget files must include standardized headers:

```typescript
/**
 * File: apps/web/components/widgets/MyWidget.tsx
 * Purpose: [Brief description of widget functionality]
 * Owner: [Team name]
 * Tags: widget, [functionality], [domain], glassmorphism, schema-driven
 */
```

---

## Widget Registration

### Step 1: Add to WidgetRegistry

**CRITICAL: Registry-First Registration**

Register your widget in the `WidgetRegistry` with transformation functions:

```typescript
// packages/asset-core/src/registries/WidgetRegistry.ts
import { MyWidgetProps } from './MyWidget';

// Add transformation function
export function transformMyWidgetSchema(schema: UniversalWidgetSchema): MyWidgetProps {
  return {
    title: schema.config?.title || schema.data?.title || 'Untitled',
    data: schema.data?.items || schema.data?.data || [],
    theme: schema.config?.theme || 'light',
    onClick: schema.config?.interactions?.find(i => i.type === 'click')?.handler
  };
}

// Add to registry
export const WIDGET_TRANSFORMERS: WidgetTransformers = {
  // ... existing transformers ...
  MyWidget: transformMyWidgetSchema
};

// Add to available types
export function isWidgetTypeAvailable(type: string): boolean {
  return Object.keys(WIDGET_TRANSFORMERS).includes(type);
}
```

### Step 2: Update WidgetDispatcher (Only Once)

**IMPORTANT: This step should be done by the platform team. Individual widget developers should NOT modify WidgetDispatcher.**

```typescript
// apps/web/components/widgets/WidgetDispatcher.tsx

// Add import (done by platform team)
import MyWidget from './MyWidget';

// Add case in switch statement (done by platform team)
case 'MyWidget':
  const myWidgetProps = transformSchemaToProps(schema, 'MyWidget');
  return <MyWidget {...myWidgetProps} />;
```

### Step 3: Export from Widget Index

Add to the widget index file:

```typescript
// apps/web/components/widgets/index.ts
export { default as MyWidget } from './MyWidget';
export { WidgetDispatcher, isWidgetTypeAvailable } from './WidgetDispatcher';
// ... other exports
```

### Step 4: Add Metadata to Registry (Optional)

For enhanced discovery and documentation:

```typescript
// packages/asset-core/src/registries/WidgetRegistry.ts
export const WIDGET_METADATA = {
  // ... existing widgets ...
  MyWidget: {
    name: 'MyWidget',
    category: 'data-display', // or 'layout', 'input', etc.
    description: 'Displays custom data with interactive features',
    tags: ['data', 'interactive', 'custom'],
    version: '1.0.0',
    author: 'Your Team',
    universalSchemaCompliant: true // ADR-0009
  }
};
```

## ⚠️ **CRITICAL: Universal System Compliance**

### **Registry-First Development Rules**

1. **NEVER modify UniversalSchemaRenderer** - It must remain universal
2. **NEVER modify WidgetDispatcher directly** - Use registry registration only
3. **ALWAYS implement transformation functions** - Schema-to-props conversion
4. **ALWAYS test via agent generation** - End-to-end schema flow
5. **ALWAYS follow ADR-0009** - Schema-props boundary separation

---

## Using Widgets in Agents

### Agent Schema Generation

Agents should generate schema objects that match widget interfaces:

```typescript
// In your agent code
const generateMyWidgetSchema = (data: any[], title: string) => {
  return {
    type: 'MyWidget',
    title,
    data,
    theme: 'light',
    metadata: {
      version: '1.0',
      source: 'agent-generated',
      fallbacks: {
        data: [{ name: 'No data available', id: 'empty' }],
        title: 'Default Widget'
      }
    }
  };
};

// Usage in agent response
const widgetSchema = generateMyWidgetSchema(userData, 'User Activity');
return { widgets: [widgetSchema] };
```

### Frontend Integration

Use `WidgetDispatcher` to render agent-generated schemas:

```tsx
// In your page/component
import { WidgetDispatcher } from '@/components/widgets';

function AgentOutputRenderer({ agentResponse }) {
  return (
    <div className="space-y-6">
      {agentResponse.widgets?.map((widget, index) => (
        <WidgetDispatcher
          key={index}
          schema={widget}
          onAction={handleWidgetAction}
        />
      ))}
    </div>
  );
}
```

---

## Schema Design Patterns

### 1. Base Schema Structure

Every widget schema should follow this pattern:

```typescript
interface BaseWidgetSchema {
  type: string;           // Widget type identifier
  [key: string]: any;     // Widget-specific properties
  metadata?: {
    version?: string;     // Schema version for migrations
    source?: string;      // Where schema originated
    fallbacks?: object;   // Default values for missing data
    validation?: object;  // Validation rules
  };
}
```

### 2. Data Handling Patterns

```typescript
// Good: Safe data access with fallbacks
const safeData = data || schema.metadata?.fallbacks?.data || [];

// Good: Graceful degradation
const title = schema.title || schema.metadata?.fallbacks?.title || 'Untitled';

// Good: Type validation
if (typeof schema.value !== 'number') {
  console.warn('Invalid value type, using fallback');
  value = schema.metadata?.fallbacks?.value || 0;
}
```

### 3. Extensibility Patterns

```typescript
// Good: Extensible schema with optional advanced features
interface ExtendedWidgetSchema extends BaseWidgetSchema {
  type: 'ExtendedWidget';
  basicProp: string;
  advancedFeatures?: {
    animations?: boolean;
    customStyling?: object;
    interactionHooks?: object;
  };
}
```

---

## Testing Widgets

### 1. Unit Testing

```typescript
// MyWidget.test.tsx
import { render, screen } from '@testing-library/react';
import MyWidget from './MyWidget';

describe('MyWidget', () => {
  const mockSchema = {
    type: 'MyWidget',
    title: 'Test Widget',
    data: [{ name: 'Item 1' }, { name: 'Item 2' }]
  };

  it('renders with schema input', () => {
    render(<MyWidget schema={mockSchema} />);
    expect(screen.getByText('Test Widget')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    const emptySchema = { ...mockSchema, data: [] };
    render(<MyWidget schema={emptySchema} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('uses fallback data when available', () => {
    const schemaWithFallback = {
      ...mockSchema,
      data: [],
      metadata: {
        fallbacks: {
          data: [{ name: 'Fallback Item' }]
        }
      }
    };
    render(<MyWidget schema={schemaWithFallback} />);
    expect(screen.getByText('Fallback Item')).toBeInTheDocument();
  });
});
```

### 2. Integration Testing

Add your widget to the test page:

```typescript
// apps/web/app/test-widgets/page.tsx
const myWidgetSchema = {
  type: 'MyWidget',
  title: 'Test My Widget',
  data: [
    { name: 'Test Item 1', id: 1 },
    { name: 'Test Item 2', id: 2 }
  ],
  theme: 'light'
};

// In the render section
<section>
  <h2 className="heading-3 mb-6">My Widget</h2>
  <WidgetDispatcher schema={myWidgetSchema} />
</section>
```

### 3. Agent Testing

Test that agents can generate valid schemas:

```typescript
// In agent tests
const agentResponse = await testAgent.processRequest('Show user data');
expect(agentResponse.widgets).toHaveLength(1);
expect(agentResponse.widgets[0].type).toBe('MyWidget');
expect(agentResponse.widgets[0].title).toBeDefined();
```

---

## Troubleshooting

### Common Issues

**1. Widget not rendering**
- Check WidgetRegistry transformation function registration
- Verify schema type is in WIDGET_TRANSFORMERS
- Ensure schema structure matches Universal Widget Schema
- Verify isWidgetTypeAvailable returns true for your widget

**2. Props not being passed correctly**
- Check transformation function in WidgetRegistry
- Verify schema-to-props mapping logic
- Ensure ADR-0009 boundary separation (schema vs props)
- Check for typos in property names

**3. Fallbacks not working**
- Check Universal Widget Schema metadata.fallbacks structure
- Verify fallback logic in transformation function
- Ensure graceful degradation patterns in widget component

**4. Type errors**
- Update widget props interfaces (not schema interfaces)
- Check transformation function return types
- Verify schema follows UniversalWidgetSchema structure
- Ensure clean separation between schema and props types

**5. Widget not discoverable**
- Verify widget is in WIDGET_TRANSFORMERS registry
- Check isWidgetTypeAvailable function includes your widget
- Ensure transformation function is properly exported
- Verify widget follows registry-first registration pattern

### Debug Checklist

**Registry-First Checklist:**
- [ ] Widget exported from index
- [ ] Transformation function implemented in WidgetRegistry
- [ ] Schema interface properly defined
- [ ] Props interface clearly separated from schema
- [ ] Fallback handling in place
- [ ] Test page entry added (via registry)
- [ ] Unit tests passing
- [ ] Agent can generate valid schemas
- [ ] UniversalSchemaRenderer unchanged
- [ ] WidgetDispatcher requires no widget-specific changes

**Universal System Validation:**
- [ ] New widget works via agent-generated schemas
- [ ] No hardcoded widget logic outside registry
- [ ] Schema-props boundary maintained (ADR-0009)
- [ ] Zero modifications to universal components

---

## Appendix: Universal Schema Structure

### Core Schema Properties

All widget schemas follow this universal structure:

```typescript
interface UniversalWidgetSchema {
  // Required: Widget identification
  type: string;                    // Unique widget type identifier

  // Widget-specific properties (varies by widget)
  [key: string]: any;

  // Optional: Enhanced schema features
  metadata?: {
    // Schema management
    version?: string;              // Schema version (e.g., "1.2.0")
    source?: string;               // Origin: "agent", "user", "system"
    timestamp?: string;            // ISO timestamp of creation

    // Fallback handling
    fallbacks?: {
      [key: string]: any;          // Default values for missing props
    };

    // Validation rules
    validation?: {
      required?: string[];         // Required property names
      types?: {                    // Expected types for properties
        [key: string]: string;
      };
      constraints?: {              // Value constraints
        [key: string]: {
          min?: number;
          max?: number;
          pattern?: string;
        };
      };
    };

    // Error handling
    errorHandling?: {
      strategy?: 'hide' | 'fallback' | 'placeholder';
      retryCount?: number;
      gracefulDegradation?: boolean;
    };

    // Performance hints
    performance?: {
      lazy?: boolean;              // Lazy load widget
      priority?: 'high' | 'medium' | 'low';
      cacheKey?: string;           // Cache identifier
    };

    // Accessibility
    accessibility?: {
      label?: string;              // Screen reader label
      description?: string;        // Detailed description
      role?: string;               // ARIA role override
    };

    // Analytics
    analytics?: {
      trackingId?: string;         // Analytics identifier
      events?: string[];           // Events to track
      category?: string;           // Analytics category
    };
  };
}
```

### Example: Complete StatCard Schema

```typescript
const completeStatCardSchema = {
  // Core widget properties
  type: 'StatCard',
  title: 'Active Users',
  value: 1250,
  change: '+12.5%',
  trend: 'up',
  icon: '👥',

  // Enhanced metadata
  metadata: {
    version: '1.0.0',
    source: 'analytics-agent',
    timestamp: '2024-01-15T10:30:00Z',

    fallbacks: {
      value: 0,
      title: 'Metric',
      change: 'No change',
      trend: 'neutral'
    },

    validation: {
      required: ['type', 'title', 'value'],
      types: {
        value: 'number',
        title: 'string',
        trend: 'string'
      },
      constraints: {
        value: { min: 0 },
        trend: { pattern: '^(up|down|neutral)$' }
      }
    },

    errorHandling: {
      strategy: 'fallback',
      gracefulDegradation: true
    },

    accessibility: {
      label: 'Active Users Metric Card',
      description: 'Shows current active user count with trend indicator'
    },

    analytics: {
      trackingId: 'stat-card-active-users',
      events: ['view', 'interact'],
      category: 'dashboard-metrics'
    }
  }
};
```

### Schema Evolution Guidelines

**Version Management:**
- Use semantic versioning (1.0.0, 1.1.0, 2.0.0)
- Increment patch for bug fixes
- Increment minor for new optional properties
- Increment major for breaking changes

**Migration Strategy:**
- Always maintain backwards compatibility for 2 major versions
- Use metadata.version to handle schema migrations
- Implement migration functions for breaking changes
- Provide clear migration guides in documentation

**Best Practices:**
- Include comprehensive fallbacks for production stability
- Use validation rules to catch errors early
- Implement graceful degradation for all widgets
- Include accessibility metadata for inclusive design
- Track widget usage with analytics metadata

This universal schema structure ensures consistency across all widgets while providing the flexibility needed for diverse use cases and future evolution.