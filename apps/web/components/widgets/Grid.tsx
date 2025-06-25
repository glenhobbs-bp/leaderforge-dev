/**
 * File: apps/web/components/widgets/Grid.tsx
 * Purpose: Extracted Grid widget from ComponentSchemaRenderer - Design System Compliant
 * Owner: Widget Team
 * Tags: #widget #grid #layout #responsive #design-system
 */

"use client";

import React from 'react';
import { BaseWidgetProps } from '@leaderforge/asset-core';
import { WidgetDispatcher } from './WidgetDispatcher';

export interface GridProps extends BaseWidgetProps {
  schema: {
    type: 'Grid';
    props: {
      title?: string;
      children: Array<{
        type: string;
        props: Record<string, unknown>;
      }>;
      columns?: 1 | 2 | 3 | 4 | 6 | 12;
      gap?: 'sm' | 'md' | 'lg' | 'xl';
      responsive?: boolean;
    };
  };
}

export function Grid({ schema }: GridProps) {
  if (schema.type !== 'Grid') {
    return null;
  }

  const { title, children, columns = 3, gap = 'md', responsive = true } = schema.props;

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const getGridClasses = () => {
    if (responsive) {
      // Responsive grid that adapts to screen size
      switch (columns) {
        case 1: return 'grid-cols-1';
        case 2: return 'grid-cols-1 md:grid-cols-2';
        case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
        case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
        case 6: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
        case 12: return 'grid-cols-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12';
        default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      }
    } else {
      // Fixed grid columns
      return `grid-cols-${columns}`;
    }
  };

  return (
    <div className="card bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm transition-all duration-200 p-6">
      {title && (
        <div className="mb-6 pb-4 border-b border-[var(--border)]">
          <h3 className="heading-4 text-[var(--text-primary)]">{title}</h3>
        </div>
      )}
      <div className={`grid ${getGridClasses()} ${gapClasses[gap]}`}>
        {children && children.map((child, i) => (
          <WidgetDispatcher
            key={i}
            schema={child}
          />
        ))}
      </div>
    </div>
  );
}