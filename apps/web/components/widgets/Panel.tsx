/**
 * File: apps/web/components/widgets/Panel.tsx
 * Purpose: Flexible layout container with glassmorphism design and configurable spacing
 * Owner: Frontend team
 * Tags: widget, layout, container, glassmorphism, schema-driven
 */

"use client";

import React from 'react';
import { UniversalSchemaRenderer } from '../ai/UniversalSchemaRenderer';
import { ComponentSchema } from '../../../../packages/agent-core/types/ComponentSchema';

// Legacy props interface for backwards compatibility
interface PanelProps {
  title?: string;
  layout?: 'vertical' | 'horizontal';
  spacing?: 'compact' | 'normal' | 'spacious';
  padding?: 'none' | 'small' | 'medium' | 'large';
  background?: 'transparent' | 'glass' | 'solid';
  children?: React.ReactNode;
  widgets?: ComponentSchema[];
}

// Schema interface for new schema-driven approach
interface PanelSchema {
  type: 'Panel';
  title?: string;
  layout?: 'vertical' | 'horizontal';
  spacing?: 'compact' | 'normal' | 'spacious';
  padding?: 'none' | 'small' | 'medium' | 'large';
  background?: 'transparent' | 'glass' | 'solid';
  children?: React.ReactNode;
  widgets?: ComponentSchema[];
  metadata?: {
    version?: string;
    source?: string;
  };
}

// Union type for transition period
type PanelInput = PanelProps | { schema: PanelSchema };

function isSchemaInput(input: PanelInput): input is { schema: PanelSchema } {
  return 'schema' in input;
}

export default function Panel(input: PanelInput) {
  // Extract props from either schema or direct props
  const props: PanelProps = isSchemaInput(input)
    ? {
        title: input.schema.title,
        layout: input.schema.layout,
        spacing: input.schema.spacing,
        padding: input.schema.padding,
        background: input.schema.background,
        children: input.schema.children,
        widgets: input.schema.widgets
      }
    : input;

  const {
    title,
    layout = 'vertical',
    spacing = 'normal',
    padding = 'medium',
    background = 'glass',
    children,
    widgets = []
  } = props;

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
        {children}
        {widgets.map((widget, index) => (
          <UniversalSchemaRenderer
            key={`panel-widget-${index}`}
            schema={widget}
          />
        ))}
      </div>
    </div>
  );
}