'use client';

// File: app/login/page.tsx
// Purpose: Public login page with styled Supabase Auth UI and token synchronization
// Owner: Frontend team
// Tags: authentication, Supabase Auth UI, login, client component

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase } from '../../components/SupabaseProvider';

export default function LoginPage() {
  const { supabase, session } = useSupabase();
  const searchParams = useSearchParams();
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCompletedAuth, setHasCompletedAuth] = useState(false);
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  // Clear potentially corrupted cookies on mount
  useEffect(() => {
    const clearCorruptedCookies = async () => {
      if (session?.user?.id) {
        console.log('[login/page] Skipping cookie clear - valid session exists');
        return;
      }

      try {
        const response = await fetch('/api/auth/clear-session', {
          method: 'POST'
        });
        if (!response.ok) {
          console.warn('[login/page] Failed to clear potentially corrupted session');
        }
      } catch (err) {
        console.warn('[login/page] Error clearing potentially corrupted session:', err);
      }
    };

    clearCorruptedCookies();
  }, [session?.user?.id]);

  // Server-side auth check - redirect immediately if user is already authenticated
  useEffect(() => {
    if (session?.user?.id && !hasCompletedAuth) {
      console.log('[login/page] 🔄 User already authenticated, redirecting to:', returnTo);
      setHasCompletedAuth(true);
      window.location.href = returnTo; // Force complete page redirect
      return;
    }
  }, [session?.user?.id, returnTo, hasCompletedAuth]);

  // Initial session check for unauthenticated users only
  useEffect(() => {
    if (hasCompletedAuth || session?.user?.id) return;

    const checkAndRedirect = async () => {
      console.log('[login/page] Checking for session in redirect effect');
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('[login/page] Session check result:', !!currentSession);
      if (currentSession) {
        console.log('[login/page] Valid session detected - redirecting to', returnTo);
        setHasCompletedAuth(true);
        window.location.href = returnTo;
      } else {
        console.log('[login/page] No session found in redirect check');
      }
    };

    checkAndRedirect();
  }, [supabase, returnTo, hasCompletedAuth, session?.user?.id]);

  // Auth state listener for unauthenticated users only
  useEffect(() => {
    if (hasCompletedAuth || session?.user?.id) {
      console.log('[login/page] Skipping auth listener setup - authentication already completed');
      return;
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (hasCompletedAuth || session?.user?.id) {
        console.log('[login/page] Skipping auth event processing - already completed');
        return;
      }

      console.log('[login/page] Auth event in redirect listener:', event, !!authSession);
      if (event === 'SIGNED_IN' && authSession) {
        console.log('[login/page] SIGNED_IN detected - syncing session to server');
        setHasCompletedAuth(true);

        if (authSession.access_token && authSession.refresh_token) {
          try {
            const response = await fetch('/api/auth/set-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: authSession.access_token,
                refresh_token: authSession.refresh_token,
                expires_at: authSession.expires_at,
                expires_in: authSession.expires_in,
                token_type: authSession.token_type,
                user: authSession.user
              })
            });

            if (response.ok) {
              console.log('[login/page] Session synced successfully');
              await new Promise(resolve => setTimeout(resolve, 100));
            } else {
              console.error('[login/page] Failed to sync session - response not ok:', response.status);
              return;
            }
          } catch (err) {
            console.error('[login/page] Failed to sync session:', err);
            return;
          }
        }
        console.log('[login/page] Redirecting to', returnTo);
        window.location.href = returnTo;
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase, returnTo, hasCompletedAuth, session?.user?.id]);

  // Loading state management
  useEffect(() => {
    if (hasCompletedAuth || session?.user?.id) {
      console.log('[login/page] Skipping loading setup - auth already completed');
      return;
    }

    const timer = setTimeout(() => {
      if (!hasCompletedAuth && !session?.user?.id) {
        setIsAuthLoaded(true);
      }
    }, 150);

    const fallbackTimer = setTimeout(async () => {
      if (hasCompletedAuth || session?.user?.id) {
        console.log('[login/page] Fallback skipped - auth already completed');
        return;
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
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
  }, [hasCompletedAuth, supabase, session?.user?.id]);

  // Early return AFTER all hooks - prevents Rules of Hooks violation
  if (hasCompletedAuth || session?.user?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/leaderforge-logo.png" alt="LeaderForge" width={120} height={40} />
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Authentication Successful!</h3>
            <p className="mt-2 text-sm text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

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