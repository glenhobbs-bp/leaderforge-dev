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
  const [loading, setLoading] = useState(false); // ✅ FIX: Start with false, only set true during actual auth operations

  const hasRestoredSession = useRef(false);
  const mounted = useRef(true);
  const processingAuth = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      if (hasRestoredSession.current || processingAuth.current) return;

      // ✅ FIX: If we have initialSession, use it directly without setSession call
      if (initialSession) {
        console.log('[SupabaseProvider] Using initial session directly');
        hasRestoredSession.current = true;
        return;
      }

      // Only try to get session if we don't have one
      if (!session) {
        setLoading(true);
        processingAuth.current = true;

        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();

          if (isMounted) {
            setSession(currentSession);
            setLoading(false);
          }
        } catch (error) {
          console.error('[SupabaseProvider] Session check error:', error);
          if (isMounted) {
            setSession(null);
            setLoading(false);
          }
        }

        processingAuth.current = false;
      }

      hasRestoredSession.current = true;
    };

    // Auth state change listener with better event handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted || processingAuth.current) return;

      console.log('[SupabaseProvider] Auth state changed:', event, newSession?.user?.id);

      // ✅ FIX: Handle auth events more precisely
      switch (event) {
        case 'INITIAL_SESSION':
          // Only process if we don't already have a session
          if (!session && newSession) {
            setSession(newSession);
          }
          break;

        case 'SIGNED_IN':
          setSession(newSession);
          setLoading(false);
          break;

        case 'SIGNED_OUT':
          setSession(null);
          setLoading(false);
          break;

        case 'TOKEN_REFRESHED':
          if (newSession) {
            setSession(newSession);
          }
          break;

        default:
          // For other events, only update if session changed
          if (newSession?.user?.id !== session?.user?.id) {
            setSession(newSession);
          }
          break;
      }
    });

    // Restore session on mount
    restoreSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove initialSession from dependencies to prevent re-runs

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

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
