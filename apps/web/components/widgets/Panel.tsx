/**
 * File: apps/web/components/widgets/Panel.tsx
 * Purpose: Extracted Panel widget from ComponentSchemaRenderer - Design System Compliant
 * Owner: Widget Team
 * Tags: #widget #panel #layout #container #design-system
 */

"use client";

import React from 'react';
import { BaseWidgetProps } from '@leaderforge/asset-core';
import { WidgetDispatcher } from './WidgetDispatcher';

export interface PanelProps extends BaseWidgetProps {
  schema: {
    type: 'Panel';
    props: {
      title?: string;
      children: Array<{
        type: string;
        props: Record<string, unknown>;
      }>;
      layout?: 'vertical' | 'horizontal';
      padding?: 'none' | 'sm' | 'md' | 'lg';
    };
  };
}

export function Panel({ schema }: PanelProps) {
  if (schema.type !== 'Panel') {
    return null;
  }

  const { title, children, layout = 'vertical', padding = 'md' } = schema.props;

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  };

  const layoutClasses = {
    vertical: 'flex flex-col gap-4',
    horizontal: 'flex flex-row gap-4 flex-wrap'
  };

  return (
    <div className={`card bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm transition-all duration-200 ${paddingClasses[padding]}`}>
      {title && (
        <div className="mb-4 pb-4 border-b border-[var(--border)]">
          <h3 className="heading-4 text-[var(--text-primary)]">{title}</h3>
        </div>
      )}
      <div className={layoutClasses[layout]}>
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