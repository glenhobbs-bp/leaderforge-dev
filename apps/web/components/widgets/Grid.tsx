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
type GridInput = GridProps | { schema: GridSchema };

function isSchemaInput(input: GridInput): input is { schema: GridSchema } {
  return 'schema' in input;
}

export default function Grid(input: GridInput) {
  // Extract props from either schema or direct props
  const props: GridProps = isSchemaInput(input)
    ? {
        title: input.schema.title,
        columns: input.schema.columns,
        gap: input.schema.gap,
        padding: input.schema.padding,
        background: input.schema.background,
        children: input.schema.children,
        widgets: input.schema.widgets
      }
    : input;

  const {
    title,
    columns = 3,
    gap = 'medium',
    padding = 'medium',
    background = 'glass',
    children,
    widgets = []
  } = props;

  const gapClasses = {
    small: 'gap-3',
    medium: 'gap-4',
    large: 'gap-6'
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
      transition-all duration-200
    `}>
      {title && (
        <h2 className="text-glass-primary text-lg font-semibold mb-6">
          {title}
        </h2>
      )}

      <div className={`
        grid
        ${columnClasses[columns]}
        ${gapClasses[gap]}
        auto-rows-fr
      `}>
        {children}
        {widgets.map((widget, index) => (
          <div key={`grid-item-${index}`} className="min-h-0">
            <UniversalSchemaRenderer schema={widget} />
          </div>
        ))}
      </div>
    </div>
  );
}