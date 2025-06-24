/**
 * File: packages/asset-core/src/types/AssetMetadata.ts
 * Purpose: Base asset metadata types for all discoverable assets
 * Owner: Asset Core Team
 * Tags: #types #metadata #assets
 */

import { z } from 'zod';

/**
 * Base metadata that all assets must have
 */
export const BaseAssetMetadataSchema = z.object({
  /** Unique identifier for the asset */
  id: z.string(),

  /** Asset type (Widget, Tool, Composition) */
  type: z.enum(['Widget', 'Tool', 'Composition']),

  /** Human-readable name */
  name: z.string(),

  /** Brief description of the asset */
  description: z.string(),

  /** Version string (semver) */
  version: z.string(),

  /** Capabilities this asset provides */
  capabilities: z.array(z.string()),

  /** Dependencies this asset requires */
  dependencies: z.array(z.string()).optional(),

  /** Tags for discovery and categorization */
  tags: z.array(z.string()).optional(),

  /** Creation timestamp */
  createdAt: z.date().optional(),

  /** Last update timestamp */
  updatedAt: z.date().optional(),

  /** Asset author/owner */
  author: z.string().optional(),
});

export type BaseAssetMetadata = z.infer<typeof BaseAssetMetadataSchema>;

/**
 * Asset capability constants for type safety
 */
export const AssetCapabilities = {
  // UI Capabilities
  VIDEO_PLAYBACK: 'video-playback',
  PROGRESS_TRACKING: 'progress-tracking',
  USER_INTERACTION: 'user-interaction',
  MODAL_DISPLAY: 'modal-display',
  RESPONSIVE_LAYOUT: 'responsive-layout',

  // Data Capabilities
  DATA_VISUALIZATION: 'data-visualization',
  REAL_TIME_UPDATES: 'real-time-updates',
  FILTERING: 'filtering',
  SORTING: 'sorting',
  PAGINATION: 'pagination',

  // Integration Capabilities
  API_INTEGRATION: 'api-integration',
  DATABASE_ACCESS: 'database-access',
  EXTERNAL_SERVICE: 'external-service',
  AUTHENTICATION: 'authentication',

  // Composition Capabilities
  COMPOSABLE: 'composable',
  CONFIGURABLE: 'configurable',
  THEMEABLE: 'themeable',
  ACCESSIBLE: 'accessible',
} as const;

export type AssetCapability = typeof AssetCapabilities[keyof typeof AssetCapabilities];

/**
 * Asset discovery query interface
 */
export const AssetQuerySchema = z.object({
  /** Asset type to search for */
  type: z.enum(['Widget', 'Tool', 'Composition']).optional(),

  /** Required capabilities */
  capabilities: z.array(z.string()).optional(),

  /** Text search in name/description */
  search: z.string().optional(),

  /** Tags to filter by */
  tags: z.array(z.string()).optional(),

  /** Maximum results to return */
  limit: z.number().min(1).max(100).default(20),
});

export type AssetQuery = z.infer<typeof AssetQuerySchema>;

/**
 * Asset discovery result
 */
export const AssetDiscoveryResultSchema = z.object({
  /** Found assets */
  assets: z.array(BaseAssetMetadataSchema),

  /** Total count (for pagination) */
  total: z.number(),

  /** Query execution time in ms */
  executionTime: z.number(),
});

export type AssetDiscoveryResult = z.infer<typeof AssetDiscoveryResultSchema>;