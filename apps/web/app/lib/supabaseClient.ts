// Supabase client for browser usage only (singleton)
import { createClient } from '@supabase/supabase-js';
// import { Database } from '@/types/supabase'; // Uncomment if you have types

// Use the public anon key for all frontend usage (never expose service_role key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// console.log('[supabaseClient] Creating Supabase client with URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// console.log('[supabaseClient] Supabase client created.');

// For server-side/API usage, always create the client in the handler:
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';
// const supabase = createServerComponentClient({ cookies });