/**
 * File: packages/agent-core/tools/EntitlementTool.ts
 * Purpose: Tool for fetching and managing entitlements from the database
 * Owner: Engineering Team
 * Tags: #tools #entitlements #database
 */

import { createClient } from '@supabase/supabase-js';

// TODO: This should be properly injected from the environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface Entitlement {
  key: string;
  name: string;
  description: string;
  tenant_key: string;
}

export class EntitlementTool {
  private static getSupabaseClient() {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }
    return createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Fetch all available entitlements from the database
   */
  static async getAvailableEntitlements(): Promise<Entitlement[]> {
    try {
      const supabase = this.getSupabaseClient();

      const { data, error } = await supabase
        .from('core.entitlements')
        .select('key, name, description, tenant_key')
        .order('name');

      if (error) {
        console.error('Error fetching entitlements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch entitlements:', error);
      return [];
    }
  }

  /**
   * Get entitlements for a specific user
   */
  static async getUserEntitlements(userId: string): Promise<string[]> {
    try {
      const supabase = this.getSupabaseClient();

      const { data, error } = await supabase
        .from('core.user_entitlements')
        .select('entitlement_key')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user entitlements:', error);
        return [];
      }

      return data?.map(e => e.entitlement_key) || [];
    } catch (error) {
      console.error('Failed to fetch user entitlements:', error);
      return [];
    }
  }

  /**
   * Update user entitlements
   */
  static async updateUserEntitlements(userId: string, entitlementKeys: string[]): Promise<boolean> {
    try {
      const supabase = this.getSupabaseClient();

      // First, remove all existing entitlements for the user
      const { error: deleteError } = await supabase
        .from('core.user_entitlements')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error removing existing entitlements:', deleteError);
        return false;
      }

      // Then, add the new entitlements
      if (entitlementKeys.length > 0) {
        const entitlementRecords = entitlementKeys.map(key => ({
          user_id: userId,
          entitlement_key: key,
          granted_at: new Date().toISOString(),
          granted_by: 'admin' // This should come from the actual admin user
        }));

        const { error: insertError } = await supabase
          .from('core.user_entitlements')
          .insert(entitlementRecords);

        if (insertError) {
          console.error('Error adding entitlements:', insertError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to update user entitlements:', error);
      return false;
    }
  }
}