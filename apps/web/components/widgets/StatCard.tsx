/**
 * File: apps/web/components/widgets/StatCard.tsx
 * Purpose: Extracted StatCard widget from ComponentSchemaRenderer - Design System Compliant
 * Owner: Widget Team
 * Tags: #widget #statcard #stats #data-visualization #design-system
 */

"use client";

import React from 'react';
import { BaseWidgetProps } from '@leaderforge/asset-core';

export interface StatCardProps extends BaseWidgetProps {
  schema: {
    type: 'StatCard';
    props: {
      title: string;
      value: string | number;
      description?: string;
    };
  };
}

export function StatCard({ schema }: StatCardProps) {
  if (schema.type !== 'StatCard') {
    return null;
  }

  const { title, value, description } = schema.props;

  return (
    <div className="card bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
      <h3 className="heading-4 text-[var(--text-primary)] mb-2">{title}</h3>
      <div className="text-3xl font-bold text-[var(--primary)] mb-1">{value}</div>
      {description && (
        <p className="body-small text-[var(--text-secondary)]">{description}</p>
      )}
    </div>
  );
}