/**
 * File: apps/web/components/widgets/StatCard.tsx
 * Purpose: Displays key performance metrics with glassmorphism design (Universal Widget Schema)
 * Owner: Frontend team
 * Tags: widget, stats, metrics, glassmorphism, universal-schema, adr-0009
 */

"use client";

import React from 'react';
import { UniversalWidgetSchema } from '../../../../packages/agent-core/types/UniversalWidgetSchema';

// StatCard component props (transformed from Universal Widget Schema)
interface StatCardProps {
  schema: UniversalWidgetSchema;
  userId?: string;
  onAction?: (action: { action: string; label: string; [key: string]: unknown }) => void;
  onProgressUpdate?: () => void;
}

export default function StatCard({ schema }: StatCardProps) {
  // Extract data from Universal Widget Schema (ADR-0009)
  const title = schema.config.title || 'Statistic';
  const value = (schema.data as any).value || '0';
  const change = (schema.data as any).change;
  const trend = ((schema.data as any).trend as 'up' | 'down' | 'neutral') || 'neutral';
  const icon = (schema.data as any).icon;

  const trendColor = {
    up: 'var(--success-500)',
    down: 'var(--error-500)',
    neutral: 'var(--text-secondary)'
  }[trend];

  const trendIcon = {
    up: '↗',
    down: '↘',
    neutral: '→'
  }[trend];

  return (
    <div className="card-glass-subtle card-glass-interactive p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-glass-muted uppercase tracking-wide font-medium">
          {title}
        </h3>
        {icon && (
          <span className="text-glass-secondary text-xl">
            {icon}
          </span>
        )}
      </div>

      <div className="mb-2">
        <span className="text-glass-primary text-3xl font-bold tracking-tight">
          {value}
        </span>
      </div>

      {change && (
        <div className="flex items-center gap-1">
          <span
            className="text-glass-tiny font-medium"
            style={{ color: trendColor }}
          >
            {trendIcon} {change}
          </span>
          <span className="text-glass-tiny">from last period</span>
        </div>
      )}
    </div>
  );
}