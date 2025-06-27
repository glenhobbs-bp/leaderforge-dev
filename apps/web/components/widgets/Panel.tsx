/**
 * File: apps/web/components/widgets/Panel.tsx
 * Purpose: Flexible layout container with glassmorphism design (Universal Widget Schema)
 * Owner: Frontend team
 * Tags: widget, layout, container, glassmorphism, universal-schema, adr-0009
 */

"use client";

import React from 'react';
import { UniversalSchemaRenderer } from '../ai/UniversalSchemaRenderer';
import { UniversalWidgetSchema } from '../../../../packages/agent-core/types/UniversalWidgetSchema';

// Panel component props (transformed from Universal Widget Schema)
interface PanelProps {
  schema: UniversalWidgetSchema;
  userId?: string;
  onAction?: (action: { action: string; label: string; [key: string]: unknown }) => void;
  onProgressUpdate?: () => void;
}

export default function Panel({ schema, userId, onAction, onProgressUpdate }: PanelProps) {
  // Extract data from Universal Widget Schema (ADR-0009)
  const title = schema.config.title;
  const layout = (schema.config as any).layout || 'vertical';
  const spacing = (schema.config as any).spacing || 'normal';
  const padding = (schema.config as any).padding || 'medium';
  const background = (schema.config as any).background || 'glass';
  const widgets = (schema.data as any).widgets || [];

  const spacingClasses = {
    compact: 'gap-2',
    normal: 'gap-4',
    spacious: 'gap-6'
  };

  const paddingClasses = {
    none: 'p-0',
    small: 'p-3',
    medium: 'p-6',
    large: 'p-8'
  };

  const backgroundClasses = {
    transparent: '',
    glass: 'card-glass-subtle',
    solid: 'card bg-[var(--surface)] border border-[var(--border)] rounded-xl'
  };

  const layoutClasses = {
    vertical: 'flex flex-col',
    horizontal: 'flex flex-row flex-wrap'
  };

  return (
    <div className={`
      ${backgroundClasses[background]}
      ${paddingClasses[padding]}
      ${layoutClasses[layout]}
      ${spacingClasses[spacing]}
      transition-all duration-200
    `}>
      {title && (
        <h2 className="text-glass-primary text-lg font-semibold mb-4 flex-shrink-0">
          {title}
        </h2>
      )}

      <div className={`
        ${layoutClasses[layout]}
        ${spacingClasses[spacing]}
        flex-1
      `}>
        {widgets.map((widget, index) => (
          <UniversalSchemaRenderer
            key={`panel-widget-${index}`}
            schema={widget}
            userId={userId}
            onAction={onAction}
            onProgressUpdate={onProgressUpdate}
          />
        ))}
      </div>
    </div>
  );
}