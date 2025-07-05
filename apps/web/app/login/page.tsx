'use client';

// File: app/login/page.tsx
// Purpose: Public login page with styled Supabase Auth UI and token synchronization
// Owner: Frontend team
// Tags: authentication, Supabase Auth UI, login, client component

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase } from '../../components/SupabaseProvider';

export default function LoginPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the returnTo parameter from URL
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[login/page] Auth state change:', event, !!session);

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

          // Redirect immediately after cookie sync
          console.log('[login/page] Redirecting to:', returnTo);
          window.location.href = returnTo;
        } catch (error) {
          console.error('[login/page] Error syncing tokens:', error);
          if (mounted) {
            setError('Authentication failed. Please try again.');
            setIsAuthenticating(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        // Reset states when signed out
        setIsAuthenticating(false);
        setError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router, returnTo]);

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
            <img src="/logos/leaderforge-logo.png" alt="LeaderForge" width={120} height={40} />
          </div>
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsAuthLoaded(true);
              }}
              className="btn btn-primary"
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
            <img src="/logos/leaderforge-logo.png" alt="LeaderForge" width={120} height={40} />
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-spinner"></div>
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
          <img src="/logos/leaderforge-logo.png" alt="LeaderForge" width={120} height={40} />
        </div>
        {returnTo !== '/dashboard' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              You&apos;ll be redirected to your requested page after login.
            </p>
          </div>
        )}
        {!isAuthLoaded ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-spinner"></div>
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
                    brand: '#008ee6', // i49 primary blue
                    brandAccent: '#007acc', // i49 primary hover
                    inputBorder: '#f0f4ff',
                    inputBackground: '#f7f9fc',
                    inputText: '#001848',
                    messageText: '#001848',
                    anchorTextColor: '#008ee6',
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