'use client';

// File: app/login/page.tsx
// Purpose: Public login page with styled Supabase Auth UI and token synchronization
// Owner: Frontend team
// Tags: authentication, Supabase Auth UI, login, client component

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase } from '../../components/SupabaseProvider';

export default function LoginPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticating(true);
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

          // Show authenticating spinner for a moment before redirect
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 500);
        } catch (error) {
          console.error('[login/page] Error syncing tokens:', error);
          if (mounted) {
            setError('Authentication failed. Please try again.');
            setIsAuthenticating(false);
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Show loading state initially to prevent flash of unstyled content
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsAuthLoaded(true);
    }, 150); // Slightly longer to ensure smooth loading

    // Fallback to ensure we never stay stuck on loading
    const fallbackTimer = window.setTimeout(() => {
      console.warn('[login/page] Fallback: forcing auth UI to show');
      setIsAuthLoaded(true);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/brilliant-icon.png" alt="Brilliant Icon" width={40} height={40} />
          </div>
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsAuthLoaded(true);
              }}
              className="px-4 py-2 bg-[#3E5E17] text-white rounded-xl hover:bg-[#2d4511] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticating) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/brilliant-icon.png" alt="Brilliant Icon" width={40} height={40} />
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3E5E17]"></div>
            <p className="mt-4 text-sm text-gray-600">Signing you in...</p>
            <p className="mt-2 text-xs text-gray-500">This may take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <img src="/logos/brilliant-icon.png" alt="Brilliant Icon" width={40} height={40} />
        </div>
        {!isAuthLoaded ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3E5E17]"></div>
            <p className="mt-4 text-sm text-gray-600">Loading...</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}