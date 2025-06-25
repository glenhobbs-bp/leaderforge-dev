/**
 * File: apps/web/components/widgets/WidgetDispatcher.tsx
 * Purpose: Widget dispatcher for rendering widgets from registry
 * Owner: Widget Team
 * Tags: #dispatcher #widgets #renderer
 */

"use client";

import React from 'react';
import { BaseWidgetProps } from '@leaderforge/asset-core';
import { widgetRegistry } from './index';

export interface WidgetDispatcherProps extends Omit<BaseWidgetProps, 'schema'> {
  schema: {
    type: string;
    props: Record<string, unknown>;
  };
  // For layout widgets that need recursive rendering
  onProgressUpdate?: () => void;
  UniversalSchemaRenderer?: React.ComponentType<{
    schema: { type: string; props: Record<string, unknown> };
    userId?: string;
    onProgressUpdate?: () => void;
  }>;
}

/**
 * Dispatches widget rendering based on schema type
 */
export function WidgetDispatcher({ schema, UniversalSchemaRenderer, onProgressUpdate, ...props }: WidgetDispatcherProps) {
  // Map schema type to widget ID (handle specific mappings for extracted widgets)
  const getWidgetId = (schemaType: string): string => {
    const mappings: Record<string, string> = {
      'Card': 'leaderforge-card', // Map Card to LeaderForgeCard for platform-specific implementation
      'StatCard': 'statcard',
      'Leaderboard': 'leaderboard',
      'VideoList': 'videolist',
      'Panel': 'panel',
      'Grid': 'grid',
      'VideoPlayer': 'videoplayer-modal', // Map VideoPlayer to VideoPlayerModal widget
    };

    return mappings[schemaType] || schemaType.toLowerCase();
  };

  const widgetId = getWidgetId(schema.type);
  const WidgetComponent = widgetRegistry.getWidgetComponent(widgetId);

  if (!WidgetComponent) {
    console.warn(`[WidgetDispatcher] No widget found for type: ${schema.type} (ID: ${widgetId})`);
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600 text-sm">
          Widget not found: {schema.type}
        </p>
      </div>
    );
  }

  // For LeaderForgeCard (Card type), pass the schema object as it expects it
  // For other widgets, pass individual props
  let widgetProps;
  if (schema.type === 'Card') {
    // LeaderForgeCard expects the schema object
    widgetProps = {
      schema,
      UniversalSchemaRenderer,
      onProgressUpdate,
      ...props
    };
  } else {
    // Other widgets expect individual props
    widgetProps = {
      ...schema.props,
      UniversalSchemaRenderer,
      onProgressUpdate,
      ...props
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return React.createElement(WidgetComponent as React.ComponentType<any>, widgetProps);
}

/**
 * Get available widget types from registry
 */
export function getAvailableWidgetTypes(): string[] {
  return widgetRegistry.getAll().map(widget => widget.name);
}

/**
 * Check if a widget type is available
 */
export function isWidgetTypeAvailable(schemaType: string): boolean {
  const getWidgetId = (schemaType: string): string => {
    const mappings: Record<string, string> = {
      'Card': 'leaderforge-card',
      'StatCard': 'statcard',
      'Leaderboard': 'leaderboard',
      'VideoList': 'videolist',
      'Panel': 'panel',
      'Grid': 'grid',
      'VideoPlayer': 'videoplayer-modal',
    };

    return mappings[schemaType] || schemaType.toLowerCase();
  };

  const widgetId = getWidgetId(schemaType);
  return !!widgetRegistry.getWidgetComponent(widgetId);
}