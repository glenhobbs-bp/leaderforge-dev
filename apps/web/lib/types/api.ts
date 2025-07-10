/**
 * File: apps/web/lib/types/api.ts
 * Purpose: TypeScript types and validation for HTTP methods per ADR-0026
 * Owner: Engineering Team
 * Tags: #api #types #validation #adr-0026
 */

// HTTP Method validation types
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface APIEndpointConfig {
  method: HTTPMethod;
  requiresAuth: boolean;
  requiresBody: boolean;
  agentInvocation: boolean;
  description: string;
}

// Validation schema for API endpoints per ADR-0026
export const validateHTTPMethod = (
  method: string,
  hasBody: boolean,
  isAgentInvocation: boolean
): boolean => {
  switch (method) {
    case 'GET':
      return !hasBody && !isAgentInvocation;
    case 'POST':
      return hasBody; // Can be agent invocation or resource creation
    case 'PUT':
    case 'PATCH':
      return hasBody && !isAgentInvocation;
    case 'DELETE':
      return true; // Body optional
    default:
      return false;
  }
};

// API endpoint configuration registry
export const API_ENDPOINT_CONFIGS: Record<string, APIEndpointConfig> = {
  // Context preferences endpoints
  'GET /api/context/preferences': {
    method: 'GET',
    requiresAuth: true,
    requiresBody: false,
    agentInvocation: true, // Uses ContextResolutionAgent
    description: 'Retrieve user context preferences via agent'
  },
  'PATCH /api/context/preferences/[id]': {
    method: 'PATCH',
    requiresAuth: true,
    requiresBody: true,
    agentInvocation: false,
    description: 'Toggle single context preference'
  },
  'PUT /api/context/preferences': {
    method: 'PUT',
    requiresAuth: true,
    requiresBody: true,
    agentInvocation: true, // Uses ContextResolutionAgent for bulk operations
    description: 'Bulk update context preferences via agent'
  },

  // Agent endpoints
  'POST /api/agent/context': {
    method: 'POST',
    requiresAuth: true,
    requiresBody: true,
    agentInvocation: true,
    description: 'Agent-driven context resolution'
  },
  'POST /api/agent/content': {
    method: 'POST',
    requiresAuth: true,
    requiresBody: true,
    agentInvocation: true,
    description: 'Agent-driven content generation'
  },

  // User endpoints
  'GET /api/user/[id]/profile': {
    method: 'GET',
    requiresAuth: true,
    requiresBody: false,
    agentInvocation: false,
    description: 'Get user profile data'
  },
  'PATCH /api/user/[id]/profile': {
    method: 'PATCH',
    requiresAuth: true,
    requiresBody: true,
    agentInvocation: false,
    description: 'Update user profile fields'
  }
};

// Validation utilities
export const validateEndpointConfig = (
  endpoint: string,
  config: APIEndpointConfig
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate method consistency
  if (!validateHTTPMethod(config.method, config.requiresBody, config.agentInvocation)) {
    errors.push(`Invalid HTTP method configuration for ${endpoint}`);
  }

  // Validate agent invocation rules
  if (config.agentInvocation && config.method !== 'POST' && config.method !== 'GET') {
    errors.push(`Agent invocations should use POST method (or GET for simple retrieval): ${endpoint}`);
  }

  // Validate body requirements
  if (config.requiresBody && config.method === 'GET') {
    errors.push(`GET endpoints cannot require body: ${endpoint}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Helper function to get endpoint configuration
export const getEndpointConfig = (endpoint: string): APIEndpointConfig | null => {
  return API_ENDPOINT_CONFIGS[endpoint] || null;
};

// Development-time validation
export const validateAllEndpoints = (): { valid: boolean; errors: string[] } => {
  const allErrors: string[] = [];

  Object.entries(API_ENDPOINT_CONFIGS).forEach(([endpoint, config]) => {
    const validation = validateEndpointConfig(endpoint, config);
    if (!validation.valid) {
      allErrors.push(...validation.errors);
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
};