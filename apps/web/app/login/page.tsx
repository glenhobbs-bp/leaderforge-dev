// File: app/login/page.tsx
// Purpose: Public login page (SSR-safe). Renders Supabase Auth UI and syncs tokens to cookies.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase } from '../../components/SupabaseProvider';

export default function LoginPage() {
  const { supabase } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
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
            throw new Error(`Cookie sync failed: ${response.statusText}`);
          }

          window.location.href = '/dashboard';
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
        <div className="flex flex-col items-center mb-6">
          <img src="/logos/brilliant-icon.png" alt="Brilliant Icon" width={40} height={40} />
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#3E5E17', // Brilliant green
                  brandAccent: '#DD8D00', // Brilliant orange
                  inputBorder: '#E3DDC9',
                  inputBackground: '#F8F4F1',
                  inputText: '#222222',
                  messageText: '#222222',
                  anchorTextColor: '#3E5E17',
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
          providers={[]} // Uncomment to enable Google sign-in
          theme="light"
        />
      </div>
    </div>
  );
}