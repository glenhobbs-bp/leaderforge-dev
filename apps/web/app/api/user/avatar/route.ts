import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

console.log('SERVICE ROLE KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8));

// Use env vars for Supabase URL and key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  console.log('API /user/avatar userId:', userId);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });
  }

  // Fetch avatar path from DB
  const { data: user, error: userError } = await supabase
    .schema('core')
    .from('users')
    .select('avatar_url')
    .eq('id', userId)
    .single();
  console.log('Supabase user fetch:', { user, userError });

  if (userError || !user || !user.avatar_url) {
    return new Response(JSON.stringify({ error: 'No avatar' }), { status: 404 });
  }

  // Generate signed URL
  const { data, error } = await supabase
    .storage
    .from('avatars')
    .createSignedUrl(user.avatar_url, 3600); // 1 hour expiry
  console.log('Supabase signedUrl result:', { data, error });

  if (error || !data?.signedUrl) {
    return new Response(JSON.stringify({ error: error?.message || 'Failed to sign URL' }), { status: 500 });
  }

  return new Response(JSON.stringify({ url: data.signedUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}