/**
 * File: apps/web/components/widgets/WidgetDispatcher.tsx
 * Purpose: Simple universal widget dispatcher
 * Owner: Widget Team
 * Tags: #widgets #dispatcher #universal-rendering
 */

"use client";

import React from 'react';

// Import widget components directly
import { LeaderForgeCard } from './LeaderForgeCard';
import { VideoPlayerModal } from './VideoPlayerModal';
import StatCard from './StatCard';
import Leaderboard from './Leaderboard';
import VideoList from './VideoList';
import Panel from './Panel';
import Grid from './Grid';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface WidgetSchema {
  type: string;
  [key: string]: any; // Allow any additional properties for schema-driven widgets
}

interface WidgetDispatcherProps {
  schema: WidgetSchema;
  userId?: string;
  onAction?: (action: any) => void;
  onProgressUpdate?: () => void;
  UniversalSchemaRenderer?: React.ComponentType<any>;
  [key: string]: any;
}

/**
 * Simple Widget Dispatcher - maps schema types to components
 */
export function WidgetDispatcher({
  schema,
  userId,
  onAction,
  onProgressUpdate,
  UniversalSchemaRenderer,
  ...otherProps
}: WidgetDispatcherProps) {
  console.log(`[WidgetDispatcher] Rendering widget: ${schema.type} with props:`, {
    hasOnAction: !!onAction,
    hasUserId: !!userId,
    otherPropsKeys: Object.keys(otherProps)
  });

  try {
    // Common props to pass to all widgets
    const commonProps = {
      schema: schema as any,
      userId,
      onAction,
      onProgressUpdate,
      UniversalSchemaRenderer,
      ...otherProps
    };

    // Direct mapping of schema types to components
    switch (schema.type) {
      case 'Card':
        return <LeaderForgeCard {...commonProps} />;

      case 'VideoPlayer':
        return <VideoPlayerModal {...commonProps} />;

      case 'StatCard':
        return <StatCard {...commonProps} />;

      case 'Leaderboard':
        return <Leaderboard {...commonProps} />;

      case 'VideoList':
        return <VideoList {...commonProps} />;

      case 'Panel':
        return <Panel {...commonProps} />;

      case 'Grid':
        return <Grid {...commonProps} />;

      default:
        console.warn(`[WidgetDispatcher] Unknown widget type: ${schema.type}`);
        return (
          <div className="card border-orange-500 bg-orange-50 p-4">
            <p className="text-orange-800">
              Unknown widget type: {schema.type}
            </p>
          </div>
        );
    }

  } catch (error) {
    console.error('[WidgetDispatcher] Error rendering widget:', error);

    return (
      <div className="card border-red-500 bg-red-50 p-4">
        <p className="text-red-800">
          Error rendering {schema.type}
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-xs text-red-600 mt-2">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        )}
      </div>
    );
  }
}

/**
 * Check if a widget type is available
 */
export function isWidgetTypeAvailable(type: string): boolean {
  const availableTypes = ['Card', 'VideoPlayer', 'StatCard', 'Leaderboard', 'VideoList', 'Panel', 'Grid'];
  return availableTypes.includes(type);
}

export default WidgetDispatcher;