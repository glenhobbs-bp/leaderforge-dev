/**
 * File: apps/web/components/widgets/Grid.tsx
 * Purpose: Responsive grid layout with glassmorphism design and configurable columns
 * Owner: Frontend team
 * Tags: widget, grid, layout, responsive, glassmorphism, schema-driven
 */

"use client";

import React from 'react';
import { UniversalSchemaRenderer } from '../ai/UniversalSchemaRenderer';
import { ComponentSchema } from '../../../../packages/agent-core/types/ComponentSchema';

// Legacy props interface for backwards compatibility
interface GridProps {
  title?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'small' | 'medium' | 'large';
  padding?: 'none' | 'small' | 'medium' | 'large';
  background?: 'transparent' | 'glass' | 'solid';
  children?: React.ReactNode;
  widgets?: ComponentSchema[];
}

// Schema interface for new schema-driven approach
interface GridSchema {
  type: 'Grid';
  props?: {
    title?: string;
    subtitle?: string;
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
    gap?: 'small' | 'medium' | 'large';
    padding?: 'none' | 'small' | 'medium' | 'large';
    background?: 'transparent' | 'glass' | 'solid';
    items?: ComponentSchema[];
    availableContent?: string[];
  };
  title?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'small' | 'medium' | 'large';
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
type GridInput = GridProps | { schema: GridSchema } | GridSchema;

function isSchemaInput(input: GridInput): input is { schema: GridSchema } {
  return 'schema' in input;
}

function isDirectSchema(input: GridInput): input is GridSchema {
  return 'type' in input && input.type === 'Grid';
}

export default function Grid(input: GridInput & { userId?: string; onAction?: (action: unknown) => void; onProgressUpdate?: () => void }) {
  // Extract props from either schema or direct props
  let props: GridProps;

  if (isDirectSchema(input)) {
    // Handle direct schema format from agent
    props = {
      title: input.props?.title || input.title,
      columns: input.props?.columns || input.columns,
      gap: input.props?.gap || input.gap,
      padding: input.props?.padding || input.padding,
      background: input.props?.background || input.background,
      children: input.children,
      widgets: input.props?.items || input.widgets || []
    };
  } else if (isSchemaInput(input)) {
    // Handle wrapped schema format
    props = {
      title: input.schema.props?.title || input.schema.title,
      columns: input.schema.props?.columns || input.schema.columns,
      gap: input.schema.props?.gap || input.schema.gap,
      padding: input.schema.props?.padding || input.schema.padding,
      background: input.schema.props?.background || input.schema.background,
      children: input.schema.children,
      widgets: input.schema.props?.items || input.schema.widgets || []
    };
  } else {
    // Handle legacy direct props format
    props = input;
  }

  const {
    title,
    columns = 3,
    gap = 'medium',
    padding = 'none',
    background = 'transparent',
    children,
    widgets = []
  } = props;

  console.log('[Grid] Rendering with:', {
    title,
    columns,
    widgetCount: widgets.length,
    widgetTypes: widgets.map(w => w.type),
    hasUserId: !!input.userId,
    hasOnAction: !!input.onAction
  });

  // Debug: Log first widget data for progress tracking
  if (widgets.length > 0) {
    const firstWidget = widgets[0];
    console.log('[Grid] First widget debug:', {
      type: firstWidget.type,
      props: firstWidget.props
    });
  }

  const gapClasses = {
    small: 'gap-4',
    medium: 'gap-6',
    large: 'gap-8'
  };

  const paddingClasses = {
    none: 'p-0',
    small: 'p-3',
    medium: 'p-6',
    large: 'p-8'
  };

  const backgroundClasses = {
    transparent: '',
    glass: 'card-glass-premium backdrop-blur-xl',
    solid: 'card bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg'
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  return (
    <div className={`
      ${backgroundClasses[background]}
      ${paddingClasses[padding]}
      transition-all duration-300 ease-out
      w-full min-h-0
    `}>
      {title && (
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-glass-primary text-2xl font-bold tracking-tight leading-tight">
            {title}
          </h2>
        </div>
      )}

      <div className={`
        grid
        ${columnClasses[columns]}
        ${gapClasses[gap]}
        auto-rows-fr
        px-8 pb-8
        w-full
      `}>
        {children}
        {widgets.map((widget, index) => (
          <div key={`grid-item-${index}`} className="min-h-0 flex w-full">
            <UniversalSchemaRenderer
              schema={widget}
              userId={input.userId}
              onProgressUpdate={input.onProgressUpdate}
            />
          </div>
        ))}
      </div>
    </div>
  );
}