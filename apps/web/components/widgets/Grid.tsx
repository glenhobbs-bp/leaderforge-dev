/**
 * File: apps/web/components/widgets/Grid.tsx
 * Purpose: Extracted Grid widget from UniversalSchemaRenderer
 * Owner: Widget Team
 * Tags: #grid #layout #widgets
 */

"use client";

import React from 'react';
import { BaseWidgetProps } from '@leaderforge/asset-core';

interface GridSchema {
  type: 'Grid';
  props: {
    items: Array<{ type: string; props: Record<string, unknown> }>;
  };
}

// UniversalSchemaRenderer type for recursive rendering
type UniversalSchemaRenderer = React.ComponentType<{
  schema: { type: string; props: Record<string, unknown> };
  userId?: string;
  onProgressUpdate?: () => void;
}>;

interface GridProps extends BaseWidgetProps {
  schema: GridSchema;
}

// Grid-specific props that extend base widget props
export interface GridWidgetProps extends GridProps {
  // Grid needs access to UniversalSchemaRenderer for recursive rendering
  UniversalSchemaRenderer?: UniversalSchemaRenderer;
}

export function Grid({ schema, userId, onProgressUpdate, UniversalSchemaRenderer }: GridProps & {
  userId?: string;
  onProgressUpdate?: () => void;
  UniversalSchemaRenderer?: UniversalSchemaRenderer;
}) {
  if (schema.type !== 'Grid') return null;

  const { items } = schema.props;

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      <div className="grid gap-8 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
        {items.map((item, i) =>
          UniversalSchemaRenderer ? (
            <UniversalSchemaRenderer
              key={i}
              schema={item}
              userId={userId}
              onProgressUpdate={onProgressUpdate}
            />
          ) : (
            <div key={i} className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">Grid item cannot be rendered without UniversalSchemaRenderer</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}