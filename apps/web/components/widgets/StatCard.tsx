/**
 * File: apps/web/components/widgets/StatCard.tsx
 * Purpose: Extracted StatCard widget from ComponentSchemaRenderer
 * Owner: Widget Team
 * Tags: #widget #statcard #stats #data-visualization
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
    <div className="rounded-lg shadow bg-white p-4 mb-4">
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
    </div>
  );
}