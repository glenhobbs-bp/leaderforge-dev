/**
 * File: apps/web/components/widgets/Panel.tsx
 * Purpose: Extracted Panel widget from UniversalSchemaRenderer
 * Owner: Widget Team
 * Tags: #panel #layout #widgets
 */

"use client";

import React from 'react';
import { BaseWidgetProps } from '@leaderforge/asset-core';

interface PanelSchema {
  type: 'Panel';
  props: {
    heading: string;
    description?: string;
    widgets?: Array<{ type: string; props: Record<string, unknown> }>;
  };
}

// UniversalSchemaRenderer type for recursive rendering
type UniversalSchemaRenderer = React.ComponentType<{
  schema: { type: string; props: Record<string, unknown> };
  userId?: string;
  onProgressUpdate?: () => void;
}>;

interface PanelProps extends BaseWidgetProps {
  schema: PanelSchema;
}

// Panel-specific props that extend base widget props
export interface PanelWidgetProps extends PanelProps {
  // Panel needs access to UniversalSchemaRenderer for recursive rendering
  UniversalSchemaRenderer?: UniversalSchemaRenderer;
}

export function Panel({ schema, userId, onProgressUpdate, UniversalSchemaRenderer }: PanelProps & {
  userId?: string;
  onProgressUpdate?: () => void;
  UniversalSchemaRenderer?: UniversalSchemaRenderer;
}) {
  if (schema.type !== 'Panel') return null;

  const { heading, description, widgets } = schema.props;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">{heading}</h2>
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      {widgets && UniversalSchemaRenderer &&
        widgets.map((widget, i) => (
          <UniversalSchemaRenderer
            key={i}
            schema={widget}
            userId={userId}
            onProgressUpdate={onProgressUpdate}
          />
        ))}
    </div>
  );
}