/**
 * File: packages/agent-core/schema/SchemaProcessor.ts
 * Purpose: Robust schema processing with graceful failure handling
 * Owner: Architecture Team
 * Tags: #schema #validation #agents #resilience
 */

import {
  UniversalWidgetSchema,
  SchemaValidationResult,
  SchemaError,
  SchemaWarning,
  SchemaEvolution,
  WidgetRegistration
} from '../types/UniversalWidgetSchema';

export class SchemaProcessor {
  private registrations = new Map<string, WidgetRegistration>();
  private evolution: SchemaEvolution;

  constructor(evolution: SchemaEvolution) {
    this.evolution = evolution;
  }

  /**
   * Register a widget with the schema processor
   */
  registerWidget(registration: WidgetRegistration): void {
    this.registrations.set(registration.id, registration);
    console.log(`[SchemaProcessor] Registered widget: ${registration.id} v${registration.version}`);
  }

  /**
   * Process and validate schema with graceful failure handling
   */
  processSchema(schema: UniversalWidgetSchema): {
    processedSchema: UniversalWidgetSchema;
    validation: SchemaValidationResult;
    fallbackUsed: boolean;
  } {
    console.log(`[SchemaProcessor] Processing schema: ${schema.type}`);

    // Step 1: Migrate schema to current version if needed
    const migratedSchema = this.migrateSchema(schema);

    // Step 2: Validate schema
    const validation = this.validateSchema(migratedSchema);

    // Step 3: Handle failures gracefully
    if (!validation.valid) {
      console.warn(`[SchemaProcessor] Schema validation failed for ${schema.type}:`, validation.errors);

      // Try to use corrected schema if available
      if (validation.corrected) {
        console.log(`[SchemaProcessor] Using corrected schema for ${schema.type}`);
        return {
          processedSchema: validation.corrected,
          validation,
          fallbackUsed: true
        };
      }

      // Try fallback widget
      const fallbackSchema = this.createFallbackSchema(migratedSchema);
      if (fallbackSchema) {
        console.log(`[SchemaProcessor] Using fallback for ${schema.type} -> ${fallbackSchema.type}`);
        return {
          processedSchema: fallbackSchema,
          validation,
          fallbackUsed: true
        };
      }

      // Last resort: error widget
      return {
        processedSchema: this.createErrorSchema(migratedSchema, validation.errors),
        validation,
        fallbackUsed: true
      };
    }

    return {
      processedSchema: migratedSchema,
      validation,
      fallbackUsed: false
    };
  }

  /**
   * Migrate schema to current version
   */
  private migrateSchema(schema: UniversalWidgetSchema): UniversalWidgetSchema {
    if (!schema.version || schema.version === this.evolution.currentVersion) {
      return { ...schema, version: this.evolution.currentVersion };
    }

    if (!this.evolution.supportedVersions.includes(schema.version)) {
      console.warn(`[SchemaProcessor] Unsupported schema version: ${schema.version}`);
      return schema;
    }

    let migratedSchema = { ...schema };
    const migration = this.evolution.migrations[schema.version];

    if (migration) {
      console.log(`[SchemaProcessor] Migrating schema from ${schema.version} to ${this.evolution.currentVersion}`);
      migratedSchema = migration(migratedSchema);
      migratedSchema.version = this.evolution.currentVersion;
    }

    return migratedSchema;
  }

  /**
   * Validate schema against widget registration
   */
  private validateSchema(schema: UniversalWidgetSchema): SchemaValidationResult {
    const errors: SchemaError[] = [];
    const warnings: SchemaWarning[] = [];

    // Check if widget type is registered
    const registration = this.registrations.get(schema.type);
    if (!registration) {
      errors.push({
        path: 'type',
        message: `Widget type '${schema.type}' is not registered`,
        severity: 'error',
        suggestedFix: this.findSimilarWidgetType(schema.type)
      });
    }

    // Validate required props based on JSON schema
    if (registration && registration.schema) {
      const propValidation = this.validateProps(schema.props, registration.schema);
      errors.push(...propValidation.errors);
      warnings.push(...propValidation.warnings);
    }

    // Validate children recursively
    if (schema.children) {
      schema.children.forEach((child, index) => {
        const childValidation = this.validateSchema(child);
        childValidation.errors.forEach(error => {
          errors.push({
            ...error,
            path: `children[${index}].${error.path}`
          });
        });
      });
    }

    // Check for deprecations
    this.checkDeprecations(schema, warnings);

    const valid = errors.filter(e => e.severity === 'error').length === 0;

    // Try to create corrected schema if possible
    let corrected: UniversalWidgetSchema | undefined;
    if (!valid && errors.length === 1 && errors[0].suggestedFix) {
      corrected = this.attemptCorrection(schema, errors[0]);
    }

    return { valid, errors, warnings, corrected };
  }

  /**
   * Validate props against JSON schema
   */
  private validateProps(props: Record<string, unknown>, jsonSchema: object): {
    errors: SchemaError[];
    warnings: SchemaWarning[];
  } {
    const errors: SchemaError[] = [];
    const warnings: SchemaWarning[] = [];

    // Basic validation - can be enhanced with ajv or similar
    // TODO: Implement full JSON schema validation using the jsonSchema parameter
    console.debug('[SchemaProcessor] JSON Schema validation:', jsonSchema);

    // Check for null/undefined required values
    Object.entries(props).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        warnings.push({
          path: `props.${key}`,
          message: `Property '${key}' is null or undefined`,
          suggestion: 'Consider providing a default value'
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Create fallback schema when primary widget fails
   */
  private createFallbackSchema(schema: UniversalWidgetSchema): UniversalWidgetSchema | null {
    // Try explicit fallback from schema
    if (schema.fallback?.type) {
      return {
        type: schema.fallback.type,
        version: this.evolution.currentVersion,
        props: schema.fallback.props || {},
        metadata: {
          attributes: {
            originalType: schema.type,
            fallbackReason: 'Explicit fallback specified'
          }
        }
      };
    }

    // Try registered fallback widget
    const registration = this.registrations.get(schema.type);
    if (registration?.fallbackWidget && this.registrations.has(registration.fallbackWidget)) {
      return {
        type: registration.fallbackWidget,
        version: this.evolution.currentVersion,
        props: this.simplifyProps(schema.props),
        metadata: {
          attributes: {
            originalType: schema.type,
            fallbackReason: 'Registered fallback widget'
          }
        }
      };
    }

    // Try generic fallbacks based on capabilities
    const genericFallback = this.findGenericFallback(schema);
    if (genericFallback) {
      return genericFallback;
    }

    return null;
  }

  /**
   * Create error widget when all else fails
   */
  private createErrorSchema(schema: UniversalWidgetSchema, errors: SchemaError[]): UniversalWidgetSchema {
    const errorDisplay = schema.fallback?.errorDisplay || 'placeholder';

    return {
      type: 'error-widget',
      version: this.evolution.currentVersion,
      props: {
        originalType: schema.type,
        errorDisplay,
        errors: errors.map(e => e.message),
        showDetails: process.env.NODE_ENV === 'development'
      },
      metadata: {
        attributes: {
          originalSchema: schema,
          processingFailed: true
        }
      }
    };
  }

  /**
   * Find similar widget type for suggestions
   */
  private findSimilarWidgetType(type: string): string | undefined {
    const registeredTypes = Array.from(this.registrations.keys());

    // Simple similarity check - can be enhanced with string distance algorithms
    const similar = registeredTypes.find(registeredType =>
      registeredType.toLowerCase().includes(type.toLowerCase()) ||
      type.toLowerCase().includes(registeredType.toLowerCase())
    );

    return similar;
  }

  /**
   * Simplify props for fallback widgets
   */
  private simplifyProps(props: Record<string, unknown>): Record<string, unknown> {
    // Extract common props that most widgets understand
    const commonProps: Record<string, unknown> = {};

    if (props.title) commonProps.title = props.title;
    if (props.text) commonProps.text = props.text;
    if (props.value) commonProps.value = props.value;
    if (props.description) commonProps.description = props.description;

    return commonProps;
  }

  /**
   * Find generic fallback based on widget capabilities
   */
  private findGenericFallback(schema: UniversalWidgetSchema): UniversalWidgetSchema | null {
    // If it has text content, fallback to simple text widget
    if (schema.props.title || schema.props.text || schema.props.description) {
      return {
        type: 'text-widget',
        version: this.evolution.currentVersion,
        props: {
          text: schema.props.title || schema.props.text || schema.props.description
        },
        metadata: {
          attributes: {
            originalType: schema.type,
            fallbackReason: 'Generic text fallback'
          }
        }
      };
    }

    return null;
  }

  /**
   * Attempt to correct schema automatically
   */
  private attemptCorrection(schema: UniversalWidgetSchema, error: SchemaError): UniversalWidgetSchema | undefined {
    if (error.path === 'type' && error.suggestedFix) {
      return {
        ...schema,
        type: error.suggestedFix as string
      };
    }

    return undefined;
  }

  /**
   * Check for deprecated features
   */
  private checkDeprecations(schema: UniversalWidgetSchema, warnings: SchemaWarning[]): void {
    Object.entries(this.evolution.deprecations).forEach(([feature, info]) => {
      if (this.schemaUsesFeature(schema, feature)) {
        warnings.push({
          path: feature,
          message: info.message,
          suggestion: info.replacement ? `Use '${info.replacement}' instead` : undefined
        });
      }
    });
  }

  /**
   * Check if schema uses deprecated feature
   */
  private schemaUsesFeature(schema: UniversalWidgetSchema, feature: string): boolean {
    // Simple check - can be enhanced based on specific deprecated features
    return JSON.stringify(schema).includes(feature);
  }
}