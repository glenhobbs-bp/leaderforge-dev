// apps/web/app/lib/types.ts
// Domain types for LeaderForge backend services

import { SupabaseClient } from '@supabase/supabase-js';

// Database row types
export interface Content {
  id: string;
  context_key: string;
  title: string;
  description?: string;
  required_entitlements?: string[];
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown; // Allow for additional fields
}

export interface Entitlement {
  id: string;
  entitlement_id: string;
  user_id?: string;
  org_id?: string;
  status?: string;
  granted_at?: string;
  revoked_at?: string | null;
  entitlement?: {
    id: string;
    name: string;
    description?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ContextConfig {
  id?: string;
  context_key: string;
  theme?: string;
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface NavOption {
  id: string;
  context_key: string;
  nav_key: string;
  label: string;
  icon?: string;
  href?: string;
  section?: string;
  order?: number;
  required_entitlements?: string[];
  agent_id?: string; // UUID of the agent to invoke for this navigation item
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: Record<string, unknown>;
  last_sign_in_at?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ContentAccessPolicy {
  id: string;
  content_id: string;
  required_entitlements?: string[];
  access_mode?: 'any' | 'all';
  [key: string]: unknown;
}

// Utility types for Supabase
export type Database = any; // TODO: Replace with generated Supabase types when available
export type TypedSupabaseClient = SupabaseClient<Database>;

// Service response types
export interface ServiceResponse<T> {
  data: T;
  error?: string;
}

// Common query filters
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface FilterOptions {
  context_key?: string;
  user_id?: string;
  is_active?: boolean;
}

export interface ProvisioningAuditLogEntry {
  id: string;
  user_id?: string;
  org_id?: string;
  entitlement_id?: string;
  action: string;
  details?: Record<string, unknown>;
  created_at: string;
  [key: string]: unknown;
}

export interface Organization {
  id: string;
  name: string;
  status?: string;
  parent_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface UserOrganization {
  id: string;
  user_id: string;
  org_id: string;
  role?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  user?: User;
  organization?: Organization;
  [key: string]: unknown;
}

export interface ProvisioningModel {
  id: string;
  module_id: string;
  model_type: string;
  config?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}