/**
 * File: packages/agent-core/types/UniversalWidgetSchema.ts
 * Purpose: Universal widget schema for agent-native UI composition
 * Owner: Architecture Team
 * Tags: #schema #agents #widgets #architecture
 */

export interface UniversalWidgetSchema {
  /** Widget type identifier - must match registry */
  type: string;

  /** Schema version for backward compatibility */
  version: string;

  /** Widget-specific properties */
  props: Record<string, unknown>;

  /** Optional nested child widgets */
  children?: UniversalWidgetSchema[];

  /** Metadata for validation and capabilities */
  metadata?: {
    /** Widget capabilities this instance uses */
    usedCapabilities?: string[];
    /** Validation rules for runtime checking */
    validation?: ValidationRule[];
    /** Custom attributes for extensibility */
    attributes?: Record<string, unknown>;
  };

  /** Fallback configuration for graceful degradation */
  fallback?: {
    /** Alternative widget type if primary fails */
    type?: string;
    /** Simplified props for fallback */
    props?: Record<string, unknown>;
    /** Error display configuration */
    errorDisplay?: 'hide' | 'placeholder' | 'message';
  };
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'enum' | 'range' | 'pattern';
  value?: unknown;
  message?: string;
}

export interface WidgetCapabilities {
  /** What this widget can display */
  displays: string[];
  /** What interactions it supports */
  interactions: string[];
  /** What data types it accepts */
  dataTypes: string[];
  /** Layout capabilities */
  layout: string[];
}

export interface WidgetRegistration {
  /** Unique widget identifier */
  id: string;
  /** Display name for agents */
  name: string;
  /** Widget description for agent selection */
  description: string;
  /** Schema version */
  version: string;
  /** Widget capabilities */
  capabilities: WidgetCapabilities;
  /** JSON Schema for validation */
  schema: object;
  /** React component */
  component: React.ComponentType<{ schema: UniversalWidgetSchema }>;
  /** Fallback widget ID if this fails */
  fallbackWidget?: string;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaError[];
  warnings: SchemaWarning[];
  corrected?: UniversalWidgetSchema;
}

export interface SchemaError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
  suggestedFix?: unknown;
}

export interface SchemaWarning {
  path: string;
  message: string;
  suggestion?: string;
}

/**
 * Schema evolution strategy for production stability
 */
export interface SchemaEvolution {
  /** Current schema version */
  currentVersion: string;
  /** Supported versions for backward compatibility */
  supportedVersions: string[];
  /** Migration functions for version upgrades */
  migrations: Record<string, (schema: UniversalWidgetSchema) => UniversalWidgetSchema>;
  /** Deprecation warnings */
  deprecations: Record<string, DeprecationInfo>;
}

export interface DeprecationInfo {
  version: string;
  message: string;
  replacement?: string;
  removeInVersion?: string;
}