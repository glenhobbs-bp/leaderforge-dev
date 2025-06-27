/**
 * File: packages/asset-core/src/registries/WidgetRegistry.ts
 * Purpose: Widget-specific registry for UI component assets
 * Owner: Asset Core Team
 * Tags: #registry #widgets #ui #adr-0009
 */

import { AssetRegistry } from './AssetRegistry';
import { WidgetMetadata, WidgetDefinition, SchemaToPropsTransformer } from '../types/WidgetSchema';

/**
 * Universal Widget Schema interface (ADR-0009)
 */
interface UniversalWidgetSchema {
  type: string;
  id: string;
  data: Record<string, unknown>;
  config: Record<string, unknown>;
  version: string;
  // Legacy support
  props?: Record<string, unknown>;
}

/**
 * Registry for widget assets with schema-to-props transformation
 */
export class WidgetRegistry extends AssetRegistry<WidgetMetadata> {
  private widgetDefinitions: Map<string, WidgetDefinition> = new Map();
  private transformers: Map<string, SchemaToPropsTransformer> = new Map();

  /**
   * Register a widget with its metadata, component, and transformation function
   */
  registerWidget(definition: WidgetDefinition): void {
    // Register metadata in base registry
    super.register(definition.metadata);

    // Store full definition for component loading
    this.widgetDefinitions.set(definition.metadata.id, definition);

    // Store transformation function if provided
    if (definition.schemaToProps) {
      this.transformers.set(definition.metadata.id, definition.schemaToProps);
    }
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
   * Get schema-to-props transformation function (ADR-0009)
   */
  getSchemaToPropsTransformer(widgetId: string): SchemaToPropsTransformer | undefined {
    return this.transformers.get(widgetId);
  }

  /**
   * Transform schema to component props using registered transformer (ADR-0009)
   */
  transformSchemaToProps(widgetId: string, schema: UniversalWidgetSchema): Record<string, unknown> {
    const transformer = this.transformers.get(widgetId);
    if (!transformer) {
      console.warn(`[WidgetRegistry] No schema transformer found for widget: ${widgetId}`);
      // Fallback: return config properties directly (legacy support)
      return {
        ...schema.config,
        ...schema.props, // Legacy schema support
      };
    }

    try {
      return transformer(schema);
    } catch (error) {
      console.error(`[WidgetRegistry] Schema transformation failed for ${widgetId}:`, error);
      // Fallback to basic transformation
      return {
        ...schema.config,
        ...schema.props,
      };
    }
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
      this.transformers.delete(widgetId);
    }
    return success;
  }

  /**
   * Clear all widgets
   */
  clear(): void {
    super.clear();
    this.widgetDefinitions.clear();
    this.transformers.clear();
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

  /**
   * Get widget definition (alias for getWidgetDefinition for consistency)
   */
  getWidget(widgetId: string): WidgetDefinition | undefined {
    return this.getWidgetDefinition(widgetId);
  }

  /**
   * Check if widget exists in registry
   */
  hasWidget(widgetId: string): boolean {
    return this.widgetDefinitions.has(widgetId);
  }

  /**
   * Get available widget types for agent discovery
   */
  getAvailableWidgetTypes(): string[] {
    return Array.from(this.widgetDefinitions.keys());
  }

  /**
   * Check if a widget type supports schema transformation
   */
  hasSchemaTransformer(widgetId: string): boolean {
    return this.transformers.has(widgetId);
  }
}