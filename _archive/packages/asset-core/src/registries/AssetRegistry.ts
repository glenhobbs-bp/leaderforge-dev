/**
 * File: packages/asset-core/src/registries/AssetRegistry.ts
 * Purpose: Base asset registry class providing common functionality
 * Owner: Asset Core Team
 * Tags: #registry #base #assets
 */

import { BaseAssetMetadata, AssetQuery, AssetDiscoveryResult } from '../types/AssetMetadata';

/**
 * Base asset registry providing common functionality for all asset types
 */
export abstract class AssetRegistry<T extends BaseAssetMetadata> {
  protected assets: Map<string, T> = new Map();
  protected indexByCapability: Map<string, Set<string>> = new Map();
  protected indexByTag: Map<string, Set<string>> = new Map();

  /**
   * Register a new asset
   */
  register(asset: T): void {
    // Validate asset
    this.validateAsset(asset);

    // Store asset
    this.assets.set(asset.id, asset);

    // Index by capabilities
    asset.capabilities.forEach(capability => {
      if (!this.indexByCapability.has(capability)) {
        this.indexByCapability.set(capability, new Set());
      }
      this.indexByCapability.get(capability)!.add(asset.id);
    });

    // Index by tags
    asset.tags?.forEach(tag => {
      if (!this.indexByTag.has(tag)) {
        this.indexByTag.set(tag, new Set());
      }
      this.indexByTag.get(tag)!.add(asset.id);
    });
  }

  /**
   * Unregister an asset
   */
  unregister(assetId: string): boolean {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    // Remove from main storage
    this.assets.delete(assetId);

    // Remove from capability index
    asset.capabilities.forEach(capability => {
      this.indexByCapability.get(capability)?.delete(assetId);
      if (this.indexByCapability.get(capability)?.size === 0) {
        this.indexByCapability.delete(capability);
      }
    });

    // Remove from tag index
    asset.tags?.forEach(tag => {
      this.indexByTag.get(tag)?.delete(assetId);
      if (this.indexByTag.get(tag)?.size === 0) {
        this.indexByTag.delete(tag);
      }
    });

    return true;
  }

  /**
   * Get asset by ID
   */
  get(assetId: string): T | undefined {
    return this.assets.get(assetId);
  }

  /**
   * Get all assets
   */
  getAll(): T[] {
    return Array.from(this.assets.values());
  }

  /**
   * Search assets based on query
   */
  search(query: AssetQuery): AssetDiscoveryResult {
    const startTime = Date.now();
    let candidateIds: Set<string> | undefined;

    // Filter by capabilities
    if (query.capabilities && query.capabilities.length > 0) {
      for (const capability of query.capabilities) {
        const capabilityIds = this.indexByCapability.get(capability);
        if (!capabilityIds || capabilityIds.size === 0) {
          // Required capability not found, return empty result
          return {
            assets: [],
            total: 0,
            executionTime: Date.now() - startTime,
          };
        }

        if (candidateIds === undefined) {
          candidateIds = new Set(capabilityIds);
        } else {
          // Intersection: keep only IDs that have all required capabilities
          candidateIds = new Set(Array.from(candidateIds).filter(id => capabilityIds.has(id)));
        }
      }
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      for (const tag of query.tags) {
        const tagIds = this.indexByTag.get(tag);
        if (!tagIds || tagIds.size === 0) {
          // Required tag not found, return empty result
          return {
            assets: [],
            total: 0,
            executionTime: Date.now() - startTime,
          };
        }

        if (candidateIds === undefined) {
          candidateIds = new Set(tagIds);
        } else {
          // Intersection: keep only IDs that have all required tags
          candidateIds = new Set(Array.from(candidateIds).filter(id => tagIds.has(id)));
        }
      }
    }

    // Get candidate assets
    let candidateAssets: T[];
    if (candidateIds === undefined) {
      // No filters applied, get all assets
      candidateAssets = this.getAll();
    } else {
      candidateAssets = Array.from(candidateIds)
        .map(id => this.assets.get(id))
        .filter((asset): asset is T => asset !== undefined);
    }

    // Text search in name/description
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      candidateAssets = candidateAssets.filter(asset =>
        asset.name.toLowerCase().includes(searchLower) ||
        asset.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply limit
    const total = candidateAssets.length;
    const limitedAssets = candidateAssets.slice(0, query.limit);

    return {
      assets: limitedAssets,
      total,
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Get assets by capability
   */
  getByCapability(capability: string): T[] {
    const assetIds = this.indexByCapability.get(capability);
    if (!assetIds) return [];

    return Array.from(assetIds)
      .map(id => this.assets.get(id))
      .filter((asset): asset is T => asset !== undefined);
  }

  /**
   * Get all available capabilities
   */
  getAvailableCapabilities(): string[] {
    return Array.from(this.indexByCapability.keys());
  }

  /**
   * Get all available tags
   */
  getAvailableTags(): string[] {
    return Array.from(this.indexByTag.keys());
  }

  /**
   * Get registry statistics
   */
  getStats() {
    return {
      totalAssets: this.assets.size,
      capabilities: this.indexByCapability.size,
      tags: this.indexByTag.size,
    };
  }

  /**
   * Clear all assets
   */
  clear(): void {
    this.assets.clear();
    this.indexByCapability.clear();
    this.indexByTag.clear();
  }

  /**
   * Validate asset before registration (to be implemented by subclasses)
   */
  protected abstract validateAsset(asset: T): void;

  /**
   * Get registry type (to be implemented by subclasses)
   */
  abstract getType(): string;
}