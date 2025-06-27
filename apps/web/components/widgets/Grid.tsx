/**
 * File: apps/web/components/widgets/Grid.tsx
 * Purpose: Responsive grid layout with glassmorphism design and configurable columns
 * Owner: Frontend team
 * Tags: widget, grid, layout, responsive, glassmorphism, schema-driven
 */

"use client";

import React from 'react';
import { UniversalSchemaRenderer } from '../ai/UniversalSchemaRenderer';
import { UniversalWidgetSchema } from '../../../../packages/agent-core/types/UniversalWidgetSchema';

// Grid component props (transformed from Universal Widget Schema)
interface GridProps {
  type: 'Grid';
  title?: string;
  subtitle?: string;
  items?: UniversalWidgetSchema[];
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  availableContent?: unknown[];
  userId?: string;
  onAction?: (action: { action: string; label: string; [key: string]: unknown }) => void;
  onProgressUpdate?: () => void;
}

export default function Grid({
  title,
  subtitle,
  items = [],
  columns = 3,
  availableContent = [],
  userId,
  onAction,
  onProgressUpdate,
  ...otherProps
}: GridProps) {
  console.log('[Grid] Rendering with:', {
    title,
    subtitle,
    columns,
    itemCount: items.length,
    itemTypes: items.map(item => item.type),
    availableContentCount: availableContent.length,
    hasUserId: !!userId,
    otherPropsKeys: Object.keys(otherProps)
  });

  const gapClasses = 'gap-6';
  const paddingClasses = 'p-0';
  const backgroundClasses = '';

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
      ${backgroundClasses}
      ${paddingClasses}
      transition-all duration-300 ease-out
      w-full min-h-0
    `}>
      {title && (
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-glass-primary text-2xl font-bold tracking-tight leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-glass-muted text-sm mt-2">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className={`
        grid
        ${columnClasses[columns]}
        ${gapClasses}
        auto-rows-fr
        px-8 pb-8
        w-full
      `}>
        {items.map((item, index) => (
          <div key={item.id || `grid-item-${index}`} className="min-h-0 flex w-full">
            <UniversalSchemaRenderer
              schema={item}
              userId={userId}
              onAction={onAction}
              onProgressUpdate={onProgressUpdate}
            />
          </div>
        ))}
      </div>

      {/* Debug info for empty state */}
      {items.length === 0 && (
        <div className="px-8 pb-8">
          <div className="text-center py-8 text-glass-muted">
            <p>No items to display</p>
            {availableContent.length > 0 && (
              <p className="text-xs mt-2">
                {availableContent.length} items in availableContent but not rendered
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}