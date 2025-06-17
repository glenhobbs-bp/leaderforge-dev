// File: app/AuthGate.PENDING_DELETE.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './lib/supabaseClient';
import DynamicContextPage from 'components/DynamicContextPage';

function logCookies(label: string) {
  if (typeof document !== 'undefined') {
    try {
      console.log(`[AuthGatePendingDelete] ${label} document.cookie:`, document.cookie);
    } catch (e) {
      console.warn(`[AuthGatePendingDelete] ${label} document.cookie: error`, e);
    }
  }
}

export default function AuthGatePendingDelete() {
  const { session, isLoading } = useSessionContext();
  const router = useRouter();

  useEffect(() => {
    logCookies('on mount');

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthGatePendingDelete] onAuthStateChange event:', event, 'session:', session);
      logCookies('onAuthStateChange');

      if (event === 'SIGNED_IN' && session) {
        const access_token = Array.isArray(session.access_token)
          ? session.access_token[0]
          : session.access_token;

        const refresh_token = Array.isArray(session.refresh_token)
          ? session.refresh_token[0]
          : session.refresh_token;

        console.log('[AuthGatePendingDelete] Preparing to sync tokens...');
        console.log('[AuthGatePendingDelete] access_token:', access_token);
        console.log('[AuthGatePendingDelete] refresh_token:', refresh_token);

        if (!access_token || !refresh_token) {
          console.warn('[AuthGatePendingDelete] Missing tokens, skipping cookie sync');
          return;
        }

        try {
          const res = await fetch('/api/auth/set-session', {
            method: 'POST',
            body: JSON.stringify({ access_token, refresh_token }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            cache: 'no-store',
          });

          const result = await res.json();
          console.log('[AuthGatePendingDelete] Cookie sync result:', result);

          setTimeout(() => {
            router.refresh();
          }, 300);
        } catch (err) {
          console.error('[AuthGatePendingDelete] Error setting session cookie:', err);
        }
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    logCookies('on session change');
  }, [session]);

  if (isLoading) return (
    <div style={{ background: '#f3f4f6' }} className="flex min-h-screen items-center justify-center w-full h-full">
      <span className="text-gray-500 text-lg">Loading...</span>
    </div>
  );

  if (!session) {
    console.log('[AuthGatePendingDelete] No session, rendering Auth UI');
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-light)]">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            theme="light"
            redirectTo={`http://localhost:3000/auth/callback`}
          />
        </div>
      </div>
    );
  }

  console.log('[AuthGatePendingDelete] Session found, rendering DynamicContextPage');
  return <DynamicContextPage />;
}