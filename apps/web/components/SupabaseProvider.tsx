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
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  // Start with initialSession to prevent auth flash
  const [session, setSession] = useState<Session | null>(initialSession);
  const [loading, setLoading] = useState(!initialSession); // Only show loading if no initial session

  const hasInitialized = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // If we have a valid initialSession, use it and mark as initialized
    if (initialSession?.user?.id) {
      console.log('[SupabaseProvider] Using valid initial session from server');
      setSession(initialSession);
      setLoading(false);
      hasInitialized.current = true;
      return;
    }

    // CRITICAL: If no initial session from server, respect that decision
    console.log('[SupabaseProvider] No initial session from server - respecting server-side auth decision');

    // Don't attempt client-side session restoration if server didn't provide a session
    // This prevents bypassing authentication
    setSession(null);
    setLoading(false);
    hasInitialized.current = true;

    // Set up auth state listener for future changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[SupabaseProvider] Auth state changed:', event, session?.user?.id);

      if (isMounted) {
        setSession(session);
        setLoading(false);
      }
    });

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
