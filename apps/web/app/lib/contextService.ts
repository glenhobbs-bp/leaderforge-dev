import { createSupabaseServerClient } from './supabaseServerClient';
import { cookies } from 'next/headers';
import type { ContextConfig } from './types';
// import { ContextConfig } from '@/types'; // Uncomment and adjust as needed

/**
 * Service for context configuration logic. Optimized for performance with minimal logging.
 */
export const contextService = {
  /**
   * Get configuration for a specific context.
   */
  async getContextConfig(supabase: any, contextKey: string): Promise<ContextConfig | null> {
    try {
      const { data, error } = await supabase
        .schema('core')
        .from('context_configs')
        .select('*')
        .eq('context_key', contextKey)
        .single();

      if (error) {
        console.error('[contextService] Error fetching context config:', error);
        return null;
      }

      return data as ContextConfig;
    } catch (error) {
      console.error('[contextService] Error in getContextConfig:', error);
      return null;
    }
  },

  /**
   * Get all available context configurations.
   */
  async getAllContextConfigs(supabase: any): Promise<ContextConfig[]> {
    try {
      const { data, error } = await supabase
        .schema('core')
        .from('context_configs')
        .select('*')
        .order('context_key');

      if (error) {
        console.error('[contextService] Error fetching context configs:', error);
        return [];
      }

      return (data || []) as ContextConfig[];
    } catch (error) {
      console.error('[contextService] Error in getAllContextConfigs:', error);
      return [];
    }
  },

  /**
   * Update a context configuration.
   */
  async updateContextConfig(supabase: any, contextKey: string, updates: Partial<ContextConfig>): Promise<ContextConfig | null> {
    try {
      const { data, error } = await supabase
        .schema('core')
        .from('context_configs')
        .update(updates)
        .eq('context_key', contextKey)
        .select()
        .single();

      if (error) {
        console.error('[contextService] Error updating context config:', error);
        return null;
      }

      return data as ContextConfig;
    } catch (error) {
      console.error('[contextService] Error in updateContextConfig:', error);
      return null;
    }
  }
};