/**
 * File: apps/web/components/widgets/Leaderboard.tsx
 * Purpose: Extracted Leaderboard widget from ComponentSchemaRenderer
 * Owner: Widget Team
 * Tags: #widget #leaderboard #data #ranking
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
    <div className="rounded-lg shadow bg-white p-4 mb-4">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <ol className="list-decimal pl-5">
        {items && items.map((item, i) => (
          <li key={i} className="flex justify-between py-1">
            <span>{item.name}</span>
            <span className="font-mono">{item.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}