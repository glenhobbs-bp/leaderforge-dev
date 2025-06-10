import { supabase } from './supabaseClient';
// import { ContextConfig } from '@/types'; // Uncomment and adjust as needed

/**
 * Service for context configuration logic. All business rules and data access for context configs live here.
 * All methods are robustly logged for observability.
 */
export const contextService = {
  /**
   * Get a single context config by key.
   */
  async getContextConfig(contextKey: string): Promise<any | null> {
    console.log(`[contextService] Fetching context config: ${contextKey}`);
    const { data, error } = await supabase
      .schema('core')
      .from('context_configs')
      .select('*')
      .eq('context_key', contextKey)
      .single();
    if (error) {
      console.error(`[contextService] Error fetching context config:`, error);
      throw error;
    }
    console.log(`[contextService] Found context config: ${data?.context_key ?? 'none'}`);
    return data || null;
  },

  /**
   * Get all context configs.
   */
  async getAllContexts(): Promise<any[]> {
    console.log(`[contextService] Fetching all context configs`);
    const { data, error } = await supabase
      .schema('core')
      .from('context_configs')
      .select('*');
    if (error) {
      console.error(`[contextService] Error fetching all context configs:`, error);
      throw error;
    }
    console.log(`[contextService] Found ${data?.length ?? 0} context configs`);
    return data || [];
  },

  /**
   * Update a context config (partial update).
   */
  async updateContextConfig(contextKey: string, config: any): Promise<any | null> {
    console.log(`[contextService] Updating context config: ${contextKey}`);
    const { data, error } = await supabase
      .schema('core')
      .from('context_configs')
      .update(config)
      .eq('context_key', contextKey)
      .select()
      .single();
    if (error) {
      console.error(`[contextService] Error updating context config:`, error);
      throw error;
    }
    console.log(`[contextService] Updated context config: ${data?.context_key ?? 'none'}`);
    return data || null;
  },
};