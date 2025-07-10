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
