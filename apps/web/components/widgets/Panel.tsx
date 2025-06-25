/**
 * File: apps/web/components/widgets/Panel.tsx
 * Purpose: Flexible layout container with glassmorphism design and configurable spacing
 * Owner: Frontend team
 * Tags: widget, layout, container, glassmorphism
 */

"use client";

import React from 'react';
import { UniversalSchemaRenderer } from '../ai/UniversalSchemaRenderer';
import { ComponentSchema } from '../../../../packages/agent-core/types/ComponentSchema';

interface PanelProps {
  title?: string;
  layout?: 'vertical' | 'horizontal';
  spacing?: 'compact' | 'normal' | 'spacious';
  padding?: 'none' | 'small' | 'medium' | 'large';
  background?: 'transparent' | 'glass' | 'solid';
  children?: React.ReactNode;
  widgets?: ComponentSchema[];
}

export default function Panel({
  title,
  layout = 'vertical',
  spacing = 'normal',
  padding = 'medium',
  background = 'glass',
  children,
  widgets = []
}: PanelProps) {
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