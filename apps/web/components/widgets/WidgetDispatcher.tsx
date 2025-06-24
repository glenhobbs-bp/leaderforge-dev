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
}

/**
 * Dispatches widget rendering based on schema type
 */
export function WidgetDispatcher({ schema, ...props }: WidgetDispatcherProps) {
  // Map schema type to widget ID (for now, simple lowercase mapping)
  const getWidgetId = (schemaType: string): string => {
    return schemaType.toLowerCase();
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

  const widgetProps = { schema, ...props };
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
  const widgetId = schemaType.toLowerCase();
  return !!widgetRegistry.getWidgetComponent(widgetId);
}