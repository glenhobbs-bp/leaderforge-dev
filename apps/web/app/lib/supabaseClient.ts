// File: app/lib/supabaseClient.ts
// Purpose: Client-side Supabase client for auth and real-time APIs

'use client';

import { createBrowserClient } from '@supabase/ssr';

// These env vars are exposed to the client in Next.js when prefixed with NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);