/**
 * File: apps/web/components/ai/UniversalSchemaRenderer.tsx
 * Purpose: Universal component renderer for agent-generated UI schemas
 * Architecture: Pure registry-driven, no hardcoded logic, no schema transformation
 * Owner: Component System
 * Tags: #universal-renderer #agent-native #registry-driven #adr-0009
 */
"use client";

import React from 'react';
import { UniversalWidgetSchema } from "../../../../packages/agent-core/types/UniversalWidgetSchema";
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { WidgetDispatcher, isWidgetTypeAvailable } from "../widgets";

/**
 * Pure Universal Schema Renderer (ADR-0009)
 *
 * PRINCIPLES:
 * - Zero transformation logic (handled by WidgetDispatcher/Registry)
 * - Zero widget-specific code (uses registry for all widgets)
 * - Zero schema format assumptions (WidgetDispatcher handles all formats)
 * - Pure pass-through to registry-based rendering system
 * - ONLY accepts UniversalWidgetSchema format (no legacy support)
 */
export function UniversalSchemaRenderer({ schema, userId, tenantKey, onAction, onProgressUpdate }: {
  schema: UniversalWidgetSchema;
  userId?: string;
  tenantKey?: string;
  onAction?: (action: { action: string; label: string; [key: string]: unknown }) => void;
  onProgressUpdate?: () => void;
}) {
  // User-friendly error UI
  function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6">
        <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mb-2" />
        <div className="text-lg font-semibold text-red-600 mb-1">No content available</div>
        <div className="text-gray-700 mb-3">{message}</div>
        {onRetry && (
          <button
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--secondary)] transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            onClick={onRetry}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Validate Universal Widget Schema format (ADR-0009)
  if (!schema || typeof schema !== 'object') {
    return <ErrorMessage message="Invalid schema format. Expected UniversalWidgetSchema." onRetry={() => window.location.reload()} />;
  }

  if (!schema.type) {
    return <ErrorMessage message="Schema missing required 'type' field." onRetry={() => window.location.reload()} />;
  }

  if (!schema.id || !schema.data || !schema.config || !schema.version) {
    console.warn('[UniversalSchemaRenderer] Schema not in Universal Widget Schema format:', {
      hasId: !!schema.id,
      hasData: !!schema.data,
      hasConfig: !!schema.config,
      hasVersion: !!schema.version,
      type: schema.type
    });
    return <ErrorMessage message={`Invalid schema format. UniversalWidgetSchema requires: id, data, config, version. Missing: ${[
      !schema.id && 'id',
      !schema.data && 'data',
      !schema.config && 'config',
      !schema.version && 'version'
    ].filter(Boolean).join(', ')}`} />;
  }

  // **UNIVERSAL RENDERING**: Pure registry-based delegation
  // WidgetDispatcher handles ALL schema formats and transformations
  if (isWidgetTypeAvailable(schema.type)) {
    return (
      <WidgetDispatcher
        schema={schema}
        userId={userId}
        tenantKey={tenantKey}
        onAction={onAction}
        onProgressUpdate={onProgressUpdate}
      />
    );
  }

  // **FALLBACK**: Only for unregistered widget types
  console.warn(`[UniversalSchemaRenderer] Widget type '${schema.type}' not found in registry`);
  return <ErrorMessage message={`Widget type '${schema.type}' is not available. Please register this widget in the widget registry.`} />;
}