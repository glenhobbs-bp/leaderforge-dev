/**
 * File: apps/web/components/widgets/Grid.tsx
 * Purpose: Extracted Grid widget from ComponentSchemaRenderer
 * Owner: Widget Team
 * Tags: #widget #grid #layout #container
 */

"use client";

import React from 'react';
import { BaseWidgetProps } from '@leaderforge/asset-core';

// Schema type for recursive rendering
type SchemaType = {
  type: string;
  props: Record<string, unknown>;
};

// ComponentSchemaRenderer type for recursive rendering
type ComponentSchemaRenderer = React.ComponentType<{
  schema: SchemaType;
  userId?: string;
  onProgressUpdate?: () => void;
}>;

export interface GridProps extends BaseWidgetProps {
  schema: {
    type: 'Grid';
    props: {
      items: Array<SchemaType>;
    };
  };
  // Grid needs access to ComponentSchemaRenderer for recursive rendering
  ComponentSchemaRenderer?: ComponentSchemaRenderer;
}

export function Grid({ schema, userId, onProgressUpdate, ComponentSchemaRenderer }: GridProps & {
  onProgressUpdate?: () => void;
  ComponentSchemaRenderer?: ComponentSchemaRenderer;
}) {
  if (schema.type !== 'Grid') {
    return null;
  }

  const { items } = schema.props;

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      <div className="grid gap-8 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
        {items.map((item, i) => (
          ComponentSchemaRenderer ? (
            <ComponentSchemaRenderer
              key={i}
              schema={item}
              userId={userId}
              onProgressUpdate={onProgressUpdate}
            />
          ) : null
        ))}
      </div>
    </div>
  );
}