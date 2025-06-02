import { supabase } from './supabaseClient';

export async function getNavOptions(contextKey: string) {
  const { data, error } = await supabase
    .schema('core')
    .from('nav_options')
    .select('*')
    .eq('context_key', contextKey)
    .order('order', { ascending: true });

  if (error) throw error;
  return data;
}