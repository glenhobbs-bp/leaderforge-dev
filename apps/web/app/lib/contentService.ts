import { supabase } from './supabaseClient';

export async function getContentForContext(contextKey: string) {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .contains('available_contexts', [contextKey])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}