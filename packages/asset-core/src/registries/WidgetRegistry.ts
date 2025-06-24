/**
 * File: packages/asset-core/src/registries/WidgetRegistry.ts
 * Purpose: Widget-specific registry for UI component assets
 * Owner: Asset Core Team
 * Tags: #registry #widgets #ui
 */

import { AssetRegistry } from './AssetRegistry';
import { WidgetMetadata, WidgetDefinition } from '../types/WidgetSchema';

/**
 * Registry for widget assets
 */
export class WidgetRegistry extends AssetRegistry<WidgetMetadata> {
  private widgetDefinitions: Map<string, WidgetDefinition> = new Map();

  /**
   * Register a widget with its metadata and component
   */
  registerWidget(definition: WidgetDefinition): void {
    // Register metadata in base registry
    super.register(definition.metadata);

    // Store full definition for component loading
    this.widgetDefinitions.set(definition.metadata.id, definition);
  }

  /**
   * Get widget definition including component
   */
  getWidgetDefinition(widgetId: string): WidgetDefinition | undefined {
    return this.widgetDefinitions.get(widgetId);
  }

  /**
   * Get widget component for rendering
   */
  getWidgetComponent(widgetId: string): React.ComponentType<unknown> | undefined {
    const definition = this.widgetDefinitions.get(widgetId);
    return definition?.component;
  }

  /**
   * Get widget component path for lazy loading
   */
  getWidgetComponentPath(widgetId: string): string | undefined {
    const definition = this.widgetDefinitions.get(widgetId);
    return definition?.componentPath;
  }

  /**
   * Unregister a widget
   */
  unregisterWidget(widgetId: string): boolean {
    const success = super.unregister(widgetId);
    if (success) {
      this.widgetDefinitions.delete(widgetId);
    }
    return success;
  }

  /**
   * Clear all widgets
   */
  clear(): void {
    super.clear();
    this.widgetDefinitions.clear();
  }

  /**
   * Validate widget metadata
   */
  protected validateAsset(metadata: WidgetMetadata): void {
    if (metadata.type !== 'Widget') {
      throw new Error(`Invalid widget type: ${metadata.type}`);
    }

    if (!metadata.category) {
      throw new Error(`Widget ${metadata.id} must have a category`);
    }

    const validCategories = ['content', 'layout', 'data', 'input', 'feedback'];
    if (!validCategories.includes(metadata.category)) {
      throw new Error(`Invalid widget category: ${metadata.category}`);
    }
  }

  /**
   * Get registry type
   */
  getType(): string {
    return 'Widget';
  }

  /**
   * Get widgets by category
   */
  getByCategory(category: string): WidgetDefinition[] {
    return Array.from(this.widgetDefinitions.values())
      .filter(def => def.metadata.category === category);
  }

  /**
   * Get all widget definitions
   */
  getAllDefinitions(): WidgetDefinition[] {
    return Array.from(this.widgetDefinitions.values());
  }
}