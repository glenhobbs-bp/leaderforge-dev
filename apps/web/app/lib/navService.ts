import { SupabaseClient } from '@supabase/supabase-js';
import { entitlementService } from './entitlementService';
// import { NavOption } from '@/types'; // Uncomment and adjust as needed

/**
 * Service for navigation options logic. All business rules and data access for nav options live here.
 * All methods are robustly logged for observability.
 */
export const navService = {
  /**
   * Get nav options for a context, filtered by user entitlement.
   */
  async getNavOptions(
    supabase: SupabaseClient<any, any, any>,
    contextKey: string,
    userId: string
  ): Promise<any[]> {
    const { data, error } = await supabase
      .schema('core')
      .from('nav_options')
      .select('*')
      .eq('context_key', contextKey)
      .order('section', { ascending: true })
      .order('order', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    // Get user entitlements (array of entitlement_id or name)
    const userEntitlements = await entitlementService.getUserEntitlements(supabase, userId);

    // Filter nav options by required_entitlements
    return data.filter((nav: any) => {
      if (!nav.required_entitlements || nav.required_entitlements.length === 0) return true;
      return nav.required_entitlements.every((ent: string) =>
        userEntitlements.some((ue: any) =>
          ue.entitlement_id === ent || ue.entitlement === ent
        )
      );
    });
  },

  /**
   * Get a single nav option by key, filtered by user entitlement.
   */
  async getNavOption(supabase: SupabaseClient<any, any, any>, contextKey: string, navKey: string, userId: string): Promise<any | null> {
    console.log(`[navService] Fetching nav option: ${navKey} for context: ${contextKey}, user: ${userId}`);
    const { data, error } = await supabase
      .schema('core')
      .from('nav_options')
      .select('*')
      .eq('context_key', contextKey)
      .eq('nav_key', navKey)
      .single();
    if (error) {
      console.error(`[navService] Error fetching nav option:`, error);
      throw error;
    }
    if (!data) return null;
    // Filter by entitlement if required
    if (data.required_entitlements && data.required_entitlements.length > 0) {
      const userEntitlements = await entitlementService.getUserEntitlements(supabase, userId);
      const hasAll = data.required_entitlements.every((ent: string) => userEntitlements.some((ue: any) => ue.entitlement_id === ent));
      if (!hasAll) {
        console.log(`[navService] User does not have required entitlements for nav option: ${navKey}`);
        return null;
      }
    }
    console.log(`[navService] Found nav option: ${data.nav_key}`);
    return data;
  },

  /**
   * Get a single nav option by UUID (id), filtered by user entitlement.
   */
  async getNavOptionById(
    supabase: SupabaseClient<any, any, any>,
    navOptionId: string,
    userId: string
  ): Promise<any | null> {
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
        userEntitlements.some((ue: any) =>
          ue.entitlement_id === ent || ue.entitlement === ent
        )
      );
      if (!hasAll) return null;
    }
    return data;
  },
};