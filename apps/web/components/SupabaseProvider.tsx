"use client";
import { createBrowserClient } from '@supabase/ssr';
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';

type SupabaseContext = {
  supabase: SupabaseClient;
  session: Session | null;
  loading: boolean;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession: Session | null;
}) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
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
      }
    )
  );

  // Use initialSession directly - no complex loading states
  const [session, setSession] = useState<Session | null>(initialSession);
  const [loading, setLoading] = useState(false); // Simplified - only true during auth transitions
  const hasInitialized = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // Simple initialization - use what the server provided
    if (initialSession?.user?.id) {
      console.log('[SupabaseProvider] ✅ Using server session for user:', initialSession.user.id);
    } else {
      console.log('[SupabaseProvider] No server session - will rely on auth state changes');
    }

    // Always set up auth state listener for login/logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[SupabaseProvider] Auth event:', event, session?.user?.id || 'no-user');

      if (isMounted) {
        // CRITICAL FIX: Don't override valid server session with INITIAL_SESSION no-user
        if (event === 'INITIAL_SESSION' && !session && initialSession?.user?.id) {
          console.log('[SupabaseProvider] 🚫 Ignoring INITIAL_SESSION no-user - keeping server session');
          return; // Keep the server session, don't override it
        }

        setSession(session);
        setLoading(false);
      }
    });

    hasInitialized.current = true;

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [initialSession, supabase.auth]);

  return (
    <Context.Provider value={{ supabase, session, loading }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }
  return context;
};
