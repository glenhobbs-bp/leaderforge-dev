/**
 * File: packages/agent-core/types/UniversalWidgetSchema.ts
 * Purpose: Universal widget schema for agent-native UI composition
 * Owner: Architecture Team
 * Tags: #schema #agents #widgets #architecture #adr-0009
 */

/**
 * Universal Widget Schema (ADR-0009 Compliant)
 *
 * SCHEMA-DRIVEN: Agent-controllable composition only
 * Components receive transformed props via schemaToProps functions
 */
export interface UniversalWidgetSchema {
  // 1. COMPOSITION: What widget, where it goes
  /** Widget type identifier - must match registry */
  type: string;

  /** Unique widget instance identifier */
  id: string;

  /** Widget positioning and layout (optional for layout widgets) */
  position?: PositionConfig;

  // 2. DATA: What content/data the widget displays
  /** Data configuration for the widget */
  data: DataConfig;

  // 3. CONFIGURATION: User/agent-configurable behavior
  /** Widget configuration properties */
  config: WidgetConfig;

  // 4. RELATIONSHIPS: How widgets communicate
  /** Child widgets for composition */
  children?: UniversalWidgetSchema[];

  /** Data bindings between widgets */
  dataBindings?: DataBinding[];

  /** Event handlers for inter-widget communication */
  eventHandlers?: EventHandler[];

  // 5. METADATA: Schema management and validation
  /** Schema version for backward compatibility */
  version: string;

  /** Fallback configuration for graceful degradation */
  fallback?: FallbackConfig;

  /** Additional metadata for validation and capabilities */
  metadata?: WidgetMetadata;
}

/**
 * Position configuration for widget layout
 */
export interface PositionConfig {
  x?: number;
  y?: number;
  width?: number | 'auto' | 'fill';
  height?: number | 'auto' | 'fill';
  zIndex?: number;
}

/**
 * Data configuration for widget content
 */
export interface DataConfig {
  /** Data source identifier */
  source: string;

  /** Query parameters for dynamic data */
  query?: Record<string, unknown>;

  /** Static content when no dynamic source */
  staticContent?: unknown;

  /** Data transformation rules */
  transformations?: DataTransformation[];
}

/**
 * Widget configuration properties (agent-controllable)
 */
export interface WidgetConfig {
  /** Display title */
  title?: string;

  /** Display subtitle */
  subtitle?: string;

  /** Layout configuration */
  layout?: {
    columns?: number;
    rows?: number;
    gap?: 'small' | 'medium' | 'large';
    direction?: 'horizontal' | 'vertical';
  };

  /** Display mode configuration */
  displayMode?: 'grid' | 'list' | 'carousel' | 'compact' | 'expanded';

  /** Interaction configuration */
  interactions?: InteractionConfig[];

  /** Visibility and conditional display */
  visibility?: {
    condition?: string;
    hideWhenEmpty?: boolean;
    requiresPermission?: string;
  };

  /** Custom configuration properties */
  custom?: Record<string, unknown>;
}

/**
 * Data transformation configuration
 */
export interface DataTransformation {
  type: 'filter' | 'sort' | 'map' | 'reduce';
  parameters: Record<string, unknown>;
}

/**
 * Interaction configuration
 */
export interface InteractionConfig {
  trigger: string;
  action: string;
  parameters?: Record<string, unknown>;
}

/**
 * Data binding between widgets
 */
export interface DataBinding {
  sourceWidgetId: string;
  sourceProperty: string;
  targetProperty: string;
  transformation?: DataTransformation;
}

/**
 * Event handler configuration
 */
export interface EventHandler {
  event: string;
  action: string;
  targetWidgetId?: string;
  parameters?: Record<string, unknown>;
}

/**
 * Fallback configuration for graceful degradation
 */
export interface FallbackConfig {
  /** Alternative widget type if primary fails */
  type?: string;
  /** Simplified configuration for fallback */
  config?: Partial<WidgetConfig>;
  /** Error display configuration */
  errorDisplay?: 'hide' | 'placeholder' | 'message';
  /** Custom fallback message */
  message?: string;
}

/**
 * Widget metadata for validation and capabilities
 */
export interface WidgetMetadata {
  /** Widget capabilities this instance uses */
  usedCapabilities?: string[];
  /** Validation rules for runtime checking */
  validation?: ValidationRule[];
  /** Custom attributes for extensibility */
  attributes?: Record<string, unknown>;
  /** Creation timestamp */
  createdAt?: string;
  /** Last modified timestamp */
  modifiedAt?: string;
  /** Creator information */
  createdBy?: string;
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
  /** Schema-to-props transformation function (ADR-0009) */
  schemaToProps: (schema: UniversalWidgetSchema) => Record<string, unknown>;
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