import { supabase } from './supabaseClient';

export async function getContextConfig(contextKey: string) {
  const { data, error } = await supabase
    .schema('core')
    .from('context_configs')
    .select('*')
    .eq('context_key', contextKey)
    .single();

  if (error) throw error;
  return data;
}