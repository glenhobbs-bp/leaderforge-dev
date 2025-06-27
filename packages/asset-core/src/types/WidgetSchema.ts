/**
 * File: packages/asset-core/src/types/WidgetSchema.ts
 * Purpose: Widget-specific types for UI component assets
 * Owner: Asset Core Team
 * Tags: #types #widgets #ui #adr-0009
 */

import { z } from 'zod';
import { BaseAssetMetadataSchema, AssetCapabilities } from './AssetMetadata';

/**
 * Widget-specific metadata extending base asset metadata
 */
export const WidgetMetadataSchema = BaseAssetMetadataSchema.extend({
  type: z.literal('Widget'),

  /** React component category */
  category: z.enum(['content', 'layout', 'data', 'input', 'feedback']),

  /** Widget size hint for layout */
  sizeHint: z.enum(['small', 'medium', 'large', 'fullwidth', 'flexible']).optional(),

  /** Whether widget supports theming */
  themeable: z.boolean().default(true),

  /** Required permissions for this widget */
  permissions: z.array(z.string()).optional(),

  /** Preview image URL */
  previewUrl: z.string().optional(),

  /** Widget-specific configuration schema */
  configSchema: z.record(z.any()).optional(),
});

export type WidgetMetadata = z.infer<typeof WidgetMetadataSchema>;

/**
 * Widget props that all widgets must accept
 */
export const BaseWidgetPropsSchema = z.object({
  /** Widget schema from agent */
  schema: z.record(z.any()),

  /** Current user ID */
  userId: z.string().optional(),

  /** Action handler function */
  onAction: z.function().optional(),

  /** Theme configuration */
  theme: z.record(z.string()).optional(),

  /** Widget instance ID */
  instanceId: z.string().optional(),
});

export type BaseWidgetProps = z.infer<typeof BaseWidgetPropsSchema>;

/**
 * Widget action schema
 */
export const WidgetActionSchema = z.object({
  /** Action type */
  action: z.string(),

  /** Action label for UI */
  label: z.string(),

  /** Additional action data */
  data: z.record(z.any()).optional(),
});

export type WidgetAction = z.infer<typeof WidgetActionSchema>;

/**
 * Universal Widget Schema import for transformation functions
 */
interface UniversalWidgetSchema {
  type: string;
  id: string;
  data: Record<string, unknown>;
  config: Record<string, unknown>;
  version: string;
  // Other properties as needed
}

/**
 * Schema-to-Props transformation function type (ADR-0009)
 */
export type SchemaToPropsTransformer = (schema: UniversalWidgetSchema) => Record<string, unknown>;

/**
 * Widget definition for registry
 */
export const WidgetDefinitionSchema = z.object({
  /** Widget metadata */
  metadata: WidgetMetadataSchema,

  /** React component (not serializable, set at runtime) */
  component: z.any().optional(),

  /** Component import path for lazy loading */
  componentPath: z.string().optional(),

  /** Schema-to-props transformation function (ADR-0009) */
  schemaToProps: z.function().optional(),

  /** Default action handlers */
  actionHandlers: z.record(z.function()).optional(),

  /** Widget validation function */
  validator: z.function().optional(),
});

export type WidgetDefinition = z.infer<typeof WidgetDefinitionSchema>;

/**
 * Common widget capabilities for ComponentSchemaRenderer extraction
 */
export const WidgetCapabilities = {
  // Content widgets (from ComponentSchemaRenderer)
  CARD_DISPLAY: 'card-display',
  VIDEO_PLAYBACK: AssetCapabilities.VIDEO_PLAYBACK,
  PROGRESS_TRACKING: AssetCapabilities.PROGRESS_TRACKING,
  MODAL_DISPLAY: AssetCapabilities.MODAL_DISPLAY,

  // Layout widgets
  GRID_LAYOUT: 'grid-layout',
  PANEL_LAYOUT: 'panel-layout',
  RESPONSIVE_LAYOUT: AssetCapabilities.RESPONSIVE_LAYOUT,

  // Data widgets
  STATISTICS_DISPLAY: 'statistics-display',
  LEADERBOARD_DISPLAY: 'leaderboard-display',
  LIST_DISPLAY: 'list-display',

  // Interactive widgets
  USER_INTERACTION: AssetCapabilities.USER_INTERACTION,
  FORM_INPUT: 'form-input',
  NAVIGATION: 'navigation',
} as const;

/**
 * Pre-defined widget types from ComponentSchemaRenderer for extraction
 */
export const ComponentSchemaWidgetTypes = [
  'Card',
  'Grid',
  'Panel',
  'StatCard',
  'Leaderboard',
  'VideoList',
  'VideoPlayer',
] as const;

export type ComponentSchemaWidgetType = typeof ComponentSchemaWidgetTypes[number];