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
  const [loading, setLoading] = useState(!!initialSession); // If we have initial session, we're still loading

  const hasRestoredSession = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      if (hasRestoredSession.current) return;
      if (!initialSession) {
        setLoading(false);
        return;
      }

      console.log('[SupabaseProvider] Restoring initial session');

      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: initialSession.access_token,
          refresh_token: initialSession.refresh_token,
        });

        if (error) {
          console.error('[SupabaseProvider] Session restoration failed:', error);
          if (isMounted) {
            setSession(null);
            setLoading(false);
          }
        } else if (isMounted) {
          console.log('[SupabaseProvider] Session restored successfully');
          setSession(data.session);
          setLoading(false);
        }
      } catch (error) {
        console.error('[SupabaseProvider] Session restoration error:', error);
        if (isMounted) {
          setSession(null);
          setLoading(false);
        }
      }

      hasRestoredSession.current = true;
    };

    // Auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[SupabaseProvider] Auth state changed:', event, newSession?.user?.id);

      if (!isMounted) return;

      // Only update session if we've completed initial restoration
      // or if this is a genuine auth change (not initial setup)
      if (hasRestoredSession.current || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setSession(newSession);
        if (hasRestoredSession.current) {
          setLoading(false);
        }
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
