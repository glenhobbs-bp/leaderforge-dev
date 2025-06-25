/**
 * File: apps/web/components/widgets/Grid.tsx
 * Purpose: Responsive grid layout with glassmorphism design and configurable columns
 * Owner: Frontend team
 * Tags: widget, grid, layout, responsive, glassmorphism
 */

"use client";

import React from 'react';
import { UniversalSchemaRenderer } from '../ai/UniversalSchemaRenderer';
import { ComponentSchema } from '../../../../packages/agent-core/types/ComponentSchema';

interface GridProps {
  title?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'small' | 'medium' | 'large';
  padding?: 'none' | 'small' | 'medium' | 'large';
  background?: 'transparent' | 'glass' | 'solid';
  children?: React.ReactNode;
  widgets?: ComponentSchema[];
}

export default function Grid({
  title,
  columns = 3,
  gap = 'medium',
  padding = 'medium',
  background = 'glass',
  children,
  widgets = []
}: GridProps) {
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