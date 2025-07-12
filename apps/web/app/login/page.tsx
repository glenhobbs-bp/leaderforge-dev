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
  const [error, setError] = useState<string | null>(null);

  // Get the returnTo parameter from URL
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  useEffect(() => {
    // Clear any corrupted cookies on mount if there are auth errors
    const clearCorruptedCookies = async () => {
      // New: Skip if we already have a valid session (post-login)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[login/page] Skipping cookie clear - valid session exists');
        return;
      }

      if (searchParams.get('error')?.includes('session_refresh_failed') ||
          searchParams.get('error')?.includes('session_exception')) {
        console.log('[login/page] Clearing corrupted cookies');
        // Assuming authService is available or needs to be imported
        // await authService.signOut(supabase);
        // router.refresh();
      }
    };

    clearCorruptedCookies();

    return () => {
    };
  }, [supabase, router, returnTo, searchParams]);

  useEffect(() => {
    const checkAndRedirect = async () => {
      console.log('[login/page] Checking for session in redirect effect');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[login/page] Session check result:', !!session);
      if (session) {
        console.log('[login/page] Valid session detected - redirecting to', returnTo);
        router.push(returnTo);
      } else {
        console.log('[login/page] No session found in redirect check');
      }
    };

    checkAndRedirect();

    // Listen for auth changes to trigger redirect
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[login/page] Auth event in redirect listener:', event, !!session);
      if (event === 'SIGNED_IN' && session) {
        console.log('[login/page] SIGNED_IN detected - syncing session to server');
        // Validate and sync to server cookies
        if (session.access_token && session.refresh_token) {
          try {
            const response = await fetch('/api/auth/set-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
                expires_in: session.expires_in,
                token_type: session.token_type,
                user: session.user
              })
            });

            if (response.ok) {
              console.log('[login/page] Session synced successfully');
              // Small delay to ensure cookie is set before redirect
              await new Promise(resolve => setTimeout(resolve, 100));
            } else {
              console.error('[login/page] Failed to sync session - response not ok:', response.status);
              return; // Don't redirect if session sync failed
            }
          } catch (err) {
            console.error('[login/page] Failed to sync session:', err);
            return; // Don't redirect if session sync failed
          }
        }
        console.log('[login/page] Redirecting to', returnTo);
        router.push(returnTo);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase, router, returnTo]);

  // Show loading state initially to prevent flash of unstyled content
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsAuthLoaded(true);
    }, 150); // Slightly longer to ensure smooth loading

    // Fallback to ensure we never stay stuck on loading
    const fallbackTimer = window.setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[login/page] Fallback skipped - session exists during timer');
        return;
      }
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