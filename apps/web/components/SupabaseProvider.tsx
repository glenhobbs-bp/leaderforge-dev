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
  const [loading, setLoading] = useState(false);

  const hasInitialized = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // If we have a valid initialSession, mark as initialized
    if (initialSession?.user?.id) {
      console.log('[SupabaseProvider] Using initial session directly');
      hasInitialized.current = true;
    } else {
      // SECURITY FIX: No client-side session restoration when server-side auth fails
      // If server-side authentication didn't provide a session, respect that decision
      console.log('[SupabaseProvider] No initial session from server - respecting server-side auth decision');
      setLoading(false);
      hasInitialized.current = true;

      // Clear any stale client-side session data to prevent auth bypass
      supabase.auth.signOut().catch(error => {
        console.warn('[SupabaseProvider] Error clearing stale session:', error);
      });
    }

    // Auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      console.log('[SupabaseProvider] Auth state changed:', event, newSession?.user?.id || 'undefined');

      // Handle auth events
      switch (event) {
        case 'INITIAL_SESSION':
          // Only process INITIAL_SESSION if we don't have a server-side session
          if (!hasInitialized.current) {
            setSession(newSession);
            setLoading(false);
            hasInitialized.current = true;
          }
          break;

        case 'SIGNED_IN':
          setSession(newSession);
          setLoading(false);
          hasInitialized.current = true;
          break;

        case 'SIGNED_OUT':
          setSession(null);
          setLoading(false);
          hasInitialized.current = true;
          break;

        case 'TOKEN_REFRESHED':
          if (newSession) {
            setSession(newSession);
          }
          break;

        default:
          // For other events, only update if session actually changed
          if (newSession?.user?.id !== session?.user?.id) {
            setSession(newSession);
          }
          break;
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
