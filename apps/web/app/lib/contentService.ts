import { SupabaseClient } from '@supabase/supabase-js';
import { entitlementService } from './entitlementService';
// import { Content } from '@/types'; // Uncomment and adjust as needed

/**
 * Service for content logic. All business rules and data access for content live here.
 * All methods are robustly logged for observability.
 */
export const contentService = {
  /**
   * Get all content for a context, filtered by user entitlement and prerequisites.
   */
  async getContentForContext(supabase: SupabaseClient<any, any, any>, contextKey: string, userId: string): Promise<any[]> {
    console.log(`[contentService] Fetching content for context: ${contextKey}, user: ${userId}`);
    const { data, error } = await supabase
      .schema('core')
      .from('content')
      .select('*')
      .eq('context_key', contextKey);
    if (error) {
      console.error(`[contentService] Error fetching content:`, error);
      throw error;
    }
    if (!data) return [];
    // Filter by entitlement
    const userEntitlements = await entitlementService.getUserEntitlements(supabase, userId);
    const filtered = data.filter((item: any) => {
      if (!item.required_entitlements || item.required_entitlements.length === 0) return true;
      return item.required_entitlements.every((ent: string) => userEntitlements.some((ue: any) => ue.entitlement_id === ent));
    });
    // Filter by prerequisites (e.g., must complete Module 1 before Module 2)
    // For now, assume user progress is not tracked; add logic here if needed
    console.log(`[contentService] Found ${filtered.length} content items for user`);
    return filtered;
  },

  /**
   * Get a single content item by ID, filtered by user entitlement and prerequisites.
   */
  async getContentById(supabase: SupabaseClient<any, any, any>, contentId: string, userId: string): Promise<any | null> {
    console.log(`[contentService] Fetching content by id: ${contentId}, user: ${userId}`);
    const { data, error } = await supabase
      .schema('core')
      .from('content')
      .select('*')
      .eq('id', contentId)
      .single();
    if (error) {
      console.error(`[contentService] Error fetching content by id:`, error);
      throw error;
    }
    if (!data) return null;
    // Filter by entitlement
    if (data.required_entitlements && data.required_entitlements.length > 0) {
      const userEntitlements = await entitlementService.getUserEntitlements(supabase, userId);
      const hasAll = data.required_entitlements.every((ent: string) => userEntitlements.some((ue: any) => ue.entitlement_id === ent));
      if (!hasAll) {
        console.log(`[contentService] User does not have required entitlements for content: ${contentId}`);
        return null;
      }
    }
    // Filter by prerequisites (future: check user progress)
    console.log(`[contentService] Found content: ${data.id}`);
    return data;
  },

  /**
   * Get all content accessible to a user for a context (alias for getContentForContext).
   */
  async getAccessibleContent(supabase: SupabaseClient<any, any, any>, userId: string, contextKey: string): Promise<any[]> {
    return this.getContentForContext(supabase, contextKey, userId);
  },
};