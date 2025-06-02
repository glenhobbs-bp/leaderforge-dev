import { supabase } from './supabaseClient';

export async function getUserEntitlements(userId: string) {
  const { data, error } = await supabase
    .from('user_entitlements')
    .select('*, entitlement:entitlement_id(*)')
    .eq('user_id', userId)
    .is('revoked_at', null);

  if (error) throw error;
  return data;
}