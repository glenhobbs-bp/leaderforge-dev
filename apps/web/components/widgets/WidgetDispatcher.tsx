/**
 * File: apps/web/components/widgets/WidgetDispatcher.tsx
 * Purpose: Universal widget dispatcher for Universal Widget Schema (ADR-0009)
 * Owner: Widget Team
 * Tags: #widgets #dispatcher #universal-rendering #adr-0009
 */

"use client";

import React from 'react';
import { UniversalWidgetSchema } from "../../../../packages/agent-core/types/UniversalWidgetSchema";

// Import widget components directly
import { LeaderForgeCard } from './LeaderForgeCard';
import { VideoPlayerModal } from './VideoPlayerModal';
import StatCard from './StatCard';
import Leaderboard from './Leaderboard';
import VideoList from './VideoList';
import Panel from './Panel';
import Grid from './Grid';

interface WidgetDispatcherProps {
  schema: UniversalWidgetSchema;
  userId?: string;
  onAction?: (action: { action: string; label: string; [key: string]: unknown }) => void;
  onProgressUpdate?: () => void;
}

/**
 * Available widget types in the system
 */
export function isWidgetTypeAvailable(type: string): boolean {
  const availableTypes = [
    'Card', 'VideoPlayer', 'StatCard', 'Leaderboard',
    'VideoList', 'Panel', 'Grid'
  ];
  return availableTypes.includes(type);
}

/**
 * Universal Widget Dispatcher (ADR-0009)
 *
 * Routes Universal Widget Schema to appropriate components.
 * All components now accept UniversalWidgetSchema directly.
 */
export function WidgetDispatcher({ schema, userId, onAction, onProgressUpdate }: WidgetDispatcherProps) {
  console.log('[WidgetDispatcher] Dispatching schema:', {
    type: schema.type,
    id: schema.id,
    hasData: !!schema.data,
    hasConfig: !!schema.config,
    userId
  });

  // Direct schema routing - no transformation needed
  switch (schema.type) {
    case 'Card':
      return (
        <LeaderForgeCard
          schema={schema}
          userId={userId}
          onAction={onAction}
          onProgressUpdate={onProgressUpdate}
        />
      );

    case 'VideoPlayer':
      return (
        <VideoPlayerModal
          schema={schema}
          userId={userId}
          onProgressUpdate={onProgressUpdate}
        />
      );

    case 'StatCard':
      return (
        <StatCard
          schema={schema}
          userId={userId}
          onAction={onAction}
          onProgressUpdate={onProgressUpdate}
        />
      );

    case 'Leaderboard':
      return (
        <Leaderboard
          schema={schema}
          userId={userId}
          onAction={onAction}
          onProgressUpdate={onProgressUpdate}
        />
      );

    case 'VideoList':
      return (
        <VideoList
          schema={schema}
          userId={userId}
          onAction={onAction}
          onProgressUpdate={onProgressUpdate}
        />
      );

    case 'Panel':
      return (
        <Panel
          schema={schema}
          userId={userId}
          onAction={onAction}
          onProgressUpdate={onProgressUpdate}
        />
      );

    case 'Grid':
      const columns = schema.config.layout?.columns || 3;
      return (
        <Grid
          type="Grid"
          title={schema.config.title}
          subtitle={schema.config.subtitle}
          items={(schema.data as any).items || []}
          columns={[1, 2, 3, 4, 5, 6].includes(columns) ? columns as 1 | 2 | 3 | 4 | 5 | 6 : 3}
          availableContent={(schema.data as any).availableContent || []}
          userId={userId}
          onAction={onAction}
          onProgressUpdate={onProgressUpdate}
        />
      );

    default:
      console.warn('[WidgetDispatcher] Unknown widget type:', schema.type);
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-red-800 font-medium">Unknown Widget Type</h3>
          <p className="text-red-600 text-sm mt-1">
            Widget type "{schema.type}" is not supported.
          </p>
          <details className="mt-2">
            <summary className="text-red-600 text-sm cursor-pointer">Debug Info</summary>
            <pre className="text-xs mt-1 text-red-700 bg-red-100 p-2 rounded overflow-auto">
              {JSON.stringify(schema, null, 2)}
            </pre>
          </details>
        </div>
      );
  }
}