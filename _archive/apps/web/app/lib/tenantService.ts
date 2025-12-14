import type { TenantConfig } from './types';

/**
 * Service for tenant configuration logic. Optimized for performance with minimal logging.
 * Updated to use the new tenants table after context-to-tenant migration.
 */
export const tenantService = {
  /**
   * Get configuration for a specific tenant.
   */
  async getTenantConfig(supabase: any, tenantKey: string): Promise<TenantConfig | null> {
    try {
      const { data, error } = await supabase
        .schema('core')
        .from('tenants')
        .select('*')
        .eq('tenant_key', tenantKey)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[tenantService] Error fetching tenant config:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('[tenantService] Error fetching tenant config:', error);
      throw error;
    }
  },

  /**
   * Get all available tenant configurations.
   */
  async getAllTenantConfigs(supabase: any): Promise<TenantConfig[]> {
    try {
      console.log('[tenantService] Starting getAllTenantConfigs query...');

      const { data, error } = await supabase
        .schema('core')
        .from('tenants')
        .select('*')
        .order('name');

      console.log('[tenantService] Tenants table query result. Data count:', data?.length || 0, 'Error:', error);

      if (error) {
        console.error('[tenantService] Error fetching tenant configs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[tenantService] Error fetching tenant configs:', error);
      throw error;
    }
  },

  /**
   * Update tenant configuration.
   */
  async updateTenantConfig(supabase: any, tenantKey: string, updates: Partial<TenantConfig>): Promise<TenantConfig | null> {
    try {
      const { data, error } = await supabase
        .schema('core')
        .from('tenants')
        .update(updates)
        .eq('tenant_key', tenantKey)
        .select()
        .single();

      if (error) {
        console.error('[tenantService] Error updating tenant config:', error);
        return null;
      }

      return data as TenantConfig;
    } catch (error) {
      console.error('[tenantService] Error in updateTenantConfig:', error);
      return null;
    }
  }
};
