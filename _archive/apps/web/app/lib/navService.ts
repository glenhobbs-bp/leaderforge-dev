import { SupabaseClient } from '@supabase/supabase-js';
import { entitlementService } from './entitlementService';
import type { NavOption, Entitlement } from './types';
// import { NavOption } from '@/types'; // Uncomment and adjust as needed

/**
 * Service for navigation options logic. All business rules and data access for nav options live here.
 * All methods are robustly logged for observability.
 */
export const navService = {
  /**
   * Get nav options for a tenant, filtered by user entitlement.
   * Uses cached entitlements for better performance.
   */
  async getNavOptions(
    supabase: SupabaseClient,
    tenantKey: string,
    userId: string
  ): Promise<NavOption[]> {
    try {
      // Get all nav options for the tenant
      const { data: navOptions, error } = await supabase
        .schema('core')
        .from('nav_options')
        .select('*')
        .eq('tenant_key', tenantKey)
        .order('section_order', { ascending: true })
        .order('order', { ascending: true });

      if (error) {
        console.error('[navService] Error fetching nav options:', error);
        return [];
      }

      // Get user entitlements once
      const userEntitlements = await entitlementService.getUserEntitlements(supabase, userId);
      const userEntitlementNames = userEntitlements.map(e => e.entitlement?.name).filter(Boolean);

      // Filter nav options by entitlements
      const filteredOptions = [];
      for (const option of navOptions || []) {
        const requiredEntitlements = option.required_entitlements || [];

        if (requiredEntitlements.length === 0) {
          // No entitlements required
          filteredOptions.push(option);
        } else {
          // Check if user has required entitlements
          const hasAccess = requiredEntitlements.every((entitlement: string) =>
            userEntitlementNames.includes(entitlement)
          );

          if (hasAccess) {
            filteredOptions.push(option);
          }
        }
      }

      return filteredOptions as NavOption[];
    } catch (error) {
      console.error('[navService] Error in getNavOptions:', error);
      return [];
    }
  },

  /**
   * Get nav options for a tenant with pre-fetched entitlements.
   * More efficient when you already have entitlements.
   */
  async getNavOptionsWithEntitlements(
    supabase: SupabaseClient,
    tenantKey: string,
    userEntitlements: Entitlement[]
  ): Promise<NavOption[]> {
    const { data, error } = await supabase
      .schema('core')
      .from('nav_options')
      .select('*')
      .eq('tenant_key', tenantKey)
      .order('section', { ascending: true })
      .order('order', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    // Filter nav options by required_entitlements using pre-fetched data
    return (data as NavOption[]).filter((nav) => {
      if (!nav.required_entitlements || nav.required_entitlements.length === 0) return true;
      return nav.required_entitlements.every((ent) =>
        userEntitlements.some((ue: Entitlement) => ue.entitlement_id === ent)
      );
    });
  },

  /**
   * Get a single nav option by key, filtered by user entitlement.
   */
  async getNavOption(
    supabase: SupabaseClient,
    tenantKey: string,
    navKey: string,
    userId: string
  ): Promise<NavOption | null> {
    try {
      const { data, error } = await supabase
        .schema('core')
        .from('nav_options')
        .select('*')
        .eq('tenant_key', tenantKey)
        .eq('nav_key', navKey)
        .single();

      if (error) {
        console.error('[navService] Error fetching nav option:', error);
        return null;
      }

      // Check entitlements
      const requiredEntitlements = data.required_entitlements || [];
      if (requiredEntitlements.length > 0) {
        const userEntitlements = await entitlementService.getUserEntitlements(supabase, userId);
        const userEntitlementNames = userEntitlements.map(e => e.entitlement?.name).filter(Boolean);

        const hasAccess = requiredEntitlements.every((entitlement: string) =>
          userEntitlementNames.includes(entitlement)
        );

        if (!hasAccess) {
          return null;
        }
      }

      return data as NavOption;
    } catch (error) {
      console.error('[navService] Error in getNavOption:', error);
      return null;
    }
  },

  /**
   * Get a single nav option by UUID (id), filtered by user entitlement.
   */
  async getNavOptionById(
    supabase: SupabaseClient,
    navOptionId: string,
    userId: string
  ): Promise<NavOption | null> {
    const { data, error } = await supabase
      .schema('core')
      .from('nav_options')
      .select('*')
      .eq('id', navOptionId)
      .single();

    if (error) throw error;
    if (!data) return null;

    if (data.required_entitlements && data.required_entitlements.length > 0) {
      const userEntitlements = await entitlementService.getUserEntitlements(supabase, userId);
      const hasAll = data.required_entitlements.every((ent: string) =>
        userEntitlements.some((ue: Entitlement) => ue.entitlement_id === ent)
      );
      if (!hasAll) return null;
    }
    return data as NavOption;
  },
};