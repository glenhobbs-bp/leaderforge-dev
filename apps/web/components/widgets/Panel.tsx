/**
 * File: apps/web/components/widgets/Panel.tsx
 * Purpose: Extracted Panel widget from ComponentSchemaRenderer
 * Owner: Widget Team
 * Tags: #widget #panel #layout #container
 */

"use client";

import React from 'react';
import { BaseWidgetProps } from '@leaderforge/asset-core';

// Schema type for recursive rendering
type SchemaType = {
  type: string;
  props: Record<string, unknown>;
};

// We need to import ComponentSchemaRenderer for recursive rendering
// This creates a circular dependency that we'll resolve with dynamic import
type ComponentSchemaRenderer = React.ComponentType<{
  schema: SchemaType;
  userId?: string;
  onProgressUpdate?: () => void;
}>;

export interface PanelProps extends BaseWidgetProps {
  schema: {
    type: 'Panel';
    props: {
      heading: string;
      description?: string;
      widgets?: Array<SchemaType>;
    };
  };
  // Panel needs access to ComponentSchemaRenderer for recursive rendering
  ComponentSchemaRenderer?: ComponentSchemaRenderer;
}

export function Panel({ schema, userId, onProgressUpdate, ComponentSchemaRenderer }: PanelProps & {
  onProgressUpdate?: () => void;
  ComponentSchemaRenderer?: ComponentSchemaRenderer;
}) {
  if (schema.type !== 'Panel') {
    return null;
  }

  const { heading, description, widgets } = schema.props;

  return (
    <div>
      <h2>{heading}</h2>
      {description && <p>{description}</p>}
      {widgets && ComponentSchemaRenderer &&
        widgets.map((w, i) => (
          <ComponentSchemaRenderer
            key={i}
            schema={w}
            userId={userId}
            onProgressUpdate={onProgressUpdate}
          />
        ))}
    </div>
  );
}