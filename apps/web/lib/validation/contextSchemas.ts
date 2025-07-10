/**
 * File: apps/web/lib/validation/contextSchemas.ts
 * Purpose: Zod validation schemas for prompt context management
 * Owner: Engineering Team
 * Tags: #validation #zod #context #forms #phase1
 */

import { z } from 'zod';

// Scope enum for prompt contexts
export const ContextScopeEnum = z.enum(['Personal', 'Team', 'Organizational', 'Global']);

// Template variables schema - key-value pairs where both are strings
export const TemplateVariablesSchema = z.record(z.string(), z.string()).optional();

// Core prompt context schema
export const PromptContextSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less')
    .trim(),
  content: z.string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be 10,000 characters or less')
    .trim(),
  scope: ContextScopeEnum,
  priority: z.number()
    .int('Priority must be a whole number')
    .min(1, 'Priority must be at least 1')
    .max(100, 'Priority must be at most 100'),
  template_variables: TemplateVariablesSchema,
  created_by: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  is_editable: z.boolean().optional()
});

// Schema for creating new contexts (excludes id, timestamps, etc.)
export const CreateContextSchema = PromptContextSchema.omit({
  id: true,
  created_by: true,
  created_at: true,
  updated_at: true,
  is_editable: true
});

// Schema for updating existing contexts (makes most fields optional)
export const UpdateContextSchema = PromptContextSchema.partial().extend({
  id: z.string().uuid() // ID is required for updates
});

// Schema for template variables text input (key=value format)
export const TemplateVariablesTextSchema = z.string()
  .optional()
  .refine((value) => {
    if (!value || !value.trim()) return true; // Empty is valid

    const lines = value.trim().split('\n');
    for (const line of lines) {
      if (line.trim() && !line.includes('=')) {
        return false; // Invalid format
      }
    }
    return true;
  }, {
    message: 'Template variables must be in key=value format (one per line)'
  });

// Schema for context preference toggle
export const ContextPreferenceSchema = z.object({
  contextId: z.string().uuid('Invalid context ID'),
  isEnabled: z.boolean()
});

// Schema for bulk context preferences update
export const BulkContextPreferencesSchema = z.object({
  preferences: z.array(ContextPreferenceSchema)
    .min(1, 'At least one preference is required')
    .max(100, 'Too many preferences in bulk update')
});

// Schema for context filter/search parameters
export const ContextFilterSchema = z.object({
  scope: ContextScopeEnum.optional(),
  search: z.string().max(100).optional(),
  enabled: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

// Helper function to parse template variables from text format
export function parseTemplateVariables(text: string): Record<string, string> {
  const variables: Record<string, string> = {};

  if (!text || !text.trim()) {
    return variables;
  }

  const lines = text.trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        variables[key.trim()] = valueParts.join('=').trim();
      }
    }
  }

  return variables;
}

// Helper function to convert template variables to text format
export function templateVariablesToText(variables: Record<string, string> | undefined): string {
  if (!variables || Object.keys(variables).length === 0) {
    return '';
  }

  return Object.entries(variables)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

// Duplicate removed - ContextFilterSchema already exists above

// Type exports
export type PromptContext = z.infer<typeof PromptContextSchema>;
export type CreateContext = z.infer<typeof CreateContextSchema>;
export type UpdateContext = z.infer<typeof UpdateContextSchema>;
export type ContextPreference = z.infer<typeof ContextPreferenceSchema>;
export type BulkContextPreferences = z.infer<typeof BulkContextPreferencesSchema>;
export type ContextFilter = z.infer<typeof ContextFilterSchema>;
export type ContextScope = z.infer<typeof ContextScopeEnum>;