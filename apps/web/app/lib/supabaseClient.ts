// File: app/lib/supabaseClient.ts
// Purpose: Client-side Supabase client for auth and real-time APIs

'use client';

import { createBrowserClient } from '@supabase/ssr';

// These env vars are exposed to the client in Next.js when prefixed with NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // SECURITY FIX: Disable all browser storage for authentication
    // This prevents session persistence in localStorage/IndexedDB that could bypass our cookie-based auth
    storage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    // Ensure sessions only come from server-side cookies, not client storage
    storageKey: 'sb-session-disabled',
    // Don't automatically refresh tokens on the client
    autoRefreshToken: false,
    // Don't persist sessions locally
    persistSession: false,
    // Disable session detection in URL to prevent auto-recovery
    detectSessionInUrl: false,
  },
});