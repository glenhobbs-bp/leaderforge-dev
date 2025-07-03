/**
 * File: apps/web/components/widgets/WidgetDispatcher.tsx
 * Purpose: Universal widget dispatcher for Universal Widget Schema (ADR-0009)
 * Owner: Widget Team
 * Tags: #widgets #dispatcher #universal-rendering #adr-0009
 */

"use client";

import React, { useMemo } from 'react';
import { UniversalWidgetSchema } from "../../../../packages/agent-core/types/UniversalWidgetSchema";
import { widgetRegistry } from './index';

interface WidgetDispatcherProps {
  schema: UniversalWidgetSchema;
  userId?: string;
  tenantKey?: string;
  onAction?: (action: { action: string; label: string; [key: string]: unknown }) => void;
  onProgressUpdate?: () => void;
}

/**
 * Widget type mapping for registry lookup
 */
const WIDGET_TYPE_MAP: Record<string, string> = {
  'Card': 'leaderforge-card',
  'VideoPlayer': 'videoplayer-modal',
  'StatCard': 'statcard',
  'Leaderboard': 'leaderboard',
  'VideoList': 'videolist',
  'Panel': 'panel',
  'Grid': 'grid',
  'Form': 'form',
  'Table': 'table'
};

/**
 * Available widget types in the system (registry-based)
 */
export function isWidgetTypeAvailable(type: string): boolean {
  const widgetId = WIDGET_TYPE_MAP[type];
  return widgetId ? !!widgetRegistry.getWidget(widgetId) : false;
}

/**
 * Registry-Based Widget Dispatcher (ADR-0009)
 *
 * Routes Universal Widget Schema to components via WidgetRegistry.
 * Eliminates hardcoded switch statement and enables true dynamic loading.
 */
export function WidgetDispatcher({ schema, userId, tenantKey, onAction, onProgressUpdate }: WidgetDispatcherProps) {
  console.log('[WidgetDispatcher] Registry-based dispatch:', {
    type: schema.type,
    id: schema.id,
    hasData: !!schema.data,
    hasConfig: !!schema.config,
    userId
  });

  // Get widget ID from type mapping
  const widgetId = WIDGET_TYPE_MAP[schema.type];

  // Registry-based component lookup
  const registeredWidget = useMemo(() => {
    if (!widgetId) {
      console.warn('[WidgetDispatcher] No widget ID mapped for type:', schema.type);
      return null;
    }

    const widget = widgetRegistry.getWidget(widgetId);
    if (!widget) {
      console.warn('[WidgetDispatcher] Widget not found in registry:', widgetId);
      return null;
    }

    return widget;
  }, [widgetId]);

    // Render widget from registry
  if (registeredWidget) {
    const WidgetComponent = registeredWidget.component as React.ComponentType<Record<string, unknown>>;

    // Handle Grid widget special props (legacy compatibility)
    if (schema.type === 'Grid') {
      const columns = schema.config.layout?.columns || 3;
      const gridData = schema.data as { items?: unknown[]; availableContent?: unknown[] };
      return (
        <WidgetComponent
          type="Grid"
          title={schema.config.title}
          subtitle={schema.config.subtitle}
          items={gridData.items || []}
          columns={[1, 2, 3, 4, 5, 6].includes(columns) ? columns as 1 | 2 | 3 | 4 | 5 | 6 : 3}
          availableContent={gridData.availableContent || []}
          userId={userId}
          onAction={onAction}
          onProgressUpdate={onProgressUpdate}
        />
      );
    }

    // Standard widget rendering (includes VideoPlayer now handled by registry)
    return (
      <WidgetComponent
        schema={schema}
        userId={userId}
        tenantKey={tenantKey}
        onAction={onAction}
        onProgressUpdate={onProgressUpdate}
      />
    );
  }

  // Unknown widget type error (registry-aware)
  const availableTypes = Object.keys(WIDGET_TYPE_MAP);
  console.warn('[WidgetDispatcher] Unknown widget type:', schema.type);

  return (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
      <h3 className="text-red-800 font-medium">Unknown Widget Type</h3>
      <p className="text-red-600 text-sm mt-1">
        Widget type &ldquo;{schema.type}&rdquo; is not registered in the widget registry.
      </p>
      <details className="mt-2">
        <summary className="text-red-600 text-sm cursor-pointer">Available Types</summary>
        <div className="text-xs mt-1 text-red-700 bg-red-100 p-2 rounded">
          <p><strong>Available:</strong> {availableTypes.join(', ')}</p>
          <p><strong>Registered Widgets:</strong> {widgetRegistry.getAllWidgets().map(w => w.metadata.id).join(', ')}</p>
        </div>
      </details>
      <details className="mt-2">
        <summary className="text-red-600 text-sm cursor-pointer">Debug Info</summary>
        <pre className="text-xs mt-1 text-red-700 bg-red-100 p-2 rounded overflow-auto">
          {JSON.stringify(schema, null, 2)}
        </pre>
      </details>
    </div>
  );
}