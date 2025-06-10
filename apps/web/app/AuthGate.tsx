"use client";
// AuthGate: Handles all client-only authentication/session logic for Next.js App Router
// This is required because page.tsx is a server component by default and cannot use client hooks.
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './lib/supabaseClient';
import DynamicContextPage from '@/components/DynamicContextPage';
import { useEffect } from 'react';

export default function AuthGate() {
  const { session, isLoading } = useSessionContext();
  console.log('[AuthGate] Render. isLoading:', isLoading, 'session:', session);

  // Listen for login and sync session to cookie via API route, then reload
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Sync the full session object to the cookie for SSR/RLS
        console.log('[AuthGate] Detected SIGNED_IN event, syncing session to cookie via /api/auth/set-session');
        await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(session),
          credentials: 'include', // Ensure cookie is set in browser
        });
        window.location.reload();
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) return <div>Loading...</div>;

  if (!session) {
    console.log('[AuthGate] No session, rendering Auth UI');
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-light)]">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={["google"]}
            theme="light"
          />
        </div>
      </div>
    );
  }

  // User is logged in, show main app
  console.log('[AuthGate] Session found, rendering DynamicContextPage');
  return <DynamicContextPage />;
}