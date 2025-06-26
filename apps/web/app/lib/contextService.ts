import { createSupabaseServerClient } from './supabaseServerClient';
import { cookies } from 'next/headers';
import type { ContextConfig } from './types';
// import { ContextConfig } from '@/types'; // Uncomment and adjust as needed

/**
 * Service for tenant configuration logic. Optimized for performance with minimal logging.
 * Updated to use the new tenants table after context-to-tenant migration.
 */
export const tenantService = {
  /**
   * Get configuration for a specific tenant.
   */
  async getContextConfig(supabase: any, contextKey: string): Promise<ContextConfig | null> {
    try {
      const { data, error } = await supabase
        .schema('core')
        .from('tenants')
        .select('*')
        .eq('tenant_key', contextKey)
        .single();

      if (error) {
        console.error('[tenantService] Error fetching context config:', error);
        return null;
      }

      return data as ContextConfig;
    } catch (error) {
      console.error('[tenantService] Error in getContextConfig:', error);
      return null;
    }
  },

  /**
   * Get all available tenant configurations.
   */
  async getAllContextConfigs(supabase: any): Promise<ContextConfig[]> {
    try {
      const { data, error } = await supabase
        .schema('core')
        .from('tenants')
        .select('*')
        .order('name');

      if (error) {
        console.error('[tenantService] Error fetching context configs:', error);
        return [];
      }

      return (data || []) as ContextConfig[];
    } catch (error) {
      console.error('[tenantService] Error in getAllContextConfigs:', error);
      return [];
    }
  },

  /**
   * Update tenant configuration.
   */
  async updateContextConfig(supabase: any, contextKey: string, updates: Partial<ContextConfig>): Promise<ContextConfig | null> {
    try {
      const { data, error } = await supabase
        .schema('core')
        .from('tenants')
        .update(updates)
        .eq('tenant_key', contextKey)
        .select()
        .single();

      if (error) {
        console.error('[tenantService] Error updating context config:', error);
        return null;
      }

      return data as ContextConfig;
    } catch (error) {
      console.error('[tenantService] Error in updateContextConfig:', error);
      return null;
    }
  }
};