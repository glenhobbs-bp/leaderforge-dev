// File: app/login/page.tsx
// Purpose: Public login page (SSR-safe). Renders Supabase Auth UI and syncs tokens to cookies.

'use client';

import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('[login/page] Signed in. Syncing tokens to cookie...');
        try {
          const response = await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
          });

          if (!response.ok) {
            throw new Error(`[login/page] Cookie sync failed: ${response.statusText}`);
          }

          console.log('[login/page] Token sync successful. Redirecting to /dashboard...');
          router.replace('/dashboard');
        } catch (error) {
          console.error('[login/page] Error syncing tokens:', error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#667eea', // LeaderForge blue
                  brandAccent: '#764ba2', // LeaderForge purple
                  inputBorder: '#e3e8ee',
                  inputBackground: '#fff',
                  inputText: '#222b45',
                  messageText: '#222b45',
                  anchorTextColor: '#667eea',
                },
                radii: {
                  borderRadiusButton: '12px',
                  inputBorderRadius: '12px',
                },
                fontSizes: {
                  baseBodySize: '15px',
                },
              },
            },
          }}
          providers={['google']}
          theme="light"
        />
      </div>
    </div>
  );
}