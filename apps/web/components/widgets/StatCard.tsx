/**
 * File: apps/web/components/widgets/StatCard.tsx
 * Purpose: Displays key performance metrics with glassmorphism design
 * Owner: Frontend team
 * Tags: widget, stats, metrics, glassmorphism, schema-driven
 */

"use client";

import React from 'react';

// Legacy props interface for backwards compatibility
interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

// Schema interface for new schema-driven approach
interface StatCardSchema {
  type: 'StatCard';
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  metadata?: {
    version?: string;
    source?: string;
  };
}

// Union type for transition period
type StatCardInput = StatCardProps | { schema: StatCardSchema };

function isSchemaInput(input: StatCardInput): input is { schema: StatCardSchema } {
  return 'schema' in input;
}

export default function StatCard(input: StatCardInput) {
  // Extract props from either schema or direct props
  const props: StatCardProps = isSchemaInput(input)
    ? {
        title: input.schema.title,
        value: input.schema.value,
        change: input.schema.change,
        trend: input.schema.trend || 'neutral',
        icon: input.schema.icon
      }
    : input;

  const { title, value, change, trend = 'neutral', icon } = props;

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