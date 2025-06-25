/**
 * File: apps/web/components/widgets/Leaderboard.tsx
 * Purpose: Extracted Leaderboard widget from ComponentSchemaRenderer - Design System Compliant
 * Owner: Widget Team
 * Tags: #widget #leaderboard #data #ranking #design-system
 */

"use client";

import React from 'react';
import { BaseWidgetProps } from '@leaderforge/asset-core';

export interface LeaderboardProps extends BaseWidgetProps {
  schema: {
    type: 'Leaderboard';
    props: {
      title: string;
      items: Array<{
        name: string;
        score: string | number;
      }>;
    };
  };
}

export function Leaderboard({ schema }: LeaderboardProps) {
  if (schema.type !== 'Leaderboard') {
    return null;
  }

  const { title, items } = schema.props;

  return (
    <div className="card bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
      <h3 className="heading-4 text-[var(--text-primary)] mb-4">{title}</h3>
      <div className="space-y-3">
        {items && items.map((item, i) => (
          <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-medium">
                {i + 1}
              </span>
              <span className="body-base text-[var(--text-primary)]">{item.name}</span>
            </div>
            <span className="font-mono font-semibold text-[var(--primary)]">{item.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}