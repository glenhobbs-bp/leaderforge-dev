/**
 * File: apps/web/app/dev/grant-admin/page.tsx
 * Purpose: Development page to grant admin access to current user
 * Owner: Engineering Team
 * Tags: #dev #admin #auth
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function GrantAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    instructions?: string;
    requiresSessionRefresh?: boolean;
    user?: {
      id: string;
      email: string;
      updated_metadata: Record<string, unknown>;
    };
    error?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string | undefined } | null>(null);

  // Check current user and admin status on mount
  useEffect(() => {
    async function checkCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({ email: user.email });
        if (user.user_metadata?.is_admin === true) {
          setResult({
            success: true,
            message: 'You already have admin access!',
            instructions: 'You can now access the admin panel.'
          });
        }
      }
    }
    checkCurrentUser();
  }, []);

  const grantAdminAccess = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/dev/grant-admin-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to grant admin access');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/login?returnTo=/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Grant Admin Access</h1>

          {currentUser && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                Logged in as: <span className="font-medium">{currentUser.email}</span>
              </p>
            </div>
          )}

          {!result && (
            <button
              onClick={grantAdminAccess}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Grant Admin Access to Current User'}
            </button>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-4">
              <div className={`p-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-md`}>
                <p className="text-sm font-medium text-gray-900 mb-2">{result.message}</p>
                {result.instructions && (
                  <p className="text-sm text-gray-600">{result.instructions}</p>
                )}
              </div>

              {result.success && result.requiresSessionRefresh && (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800 font-medium mb-2">Next Steps:</p>
                    <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                      <li>Click the &ldquo;Log Out&rdquo; button below</li>
                      <li>You&apos;ll be redirected to the login page</li>
                      <li>Log in with your credentials</li>
                      <li>You&apos;ll be automatically redirected to the admin panel</li>
                    </ol>
                  </div>

                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Logging out...' : 'Log Out and Continue'}
                  </button>
                </div>
              )}

              {result.success && result.user?.updated_metadata?.is_admin && !result.requiresSessionRefresh && (
                <button
                  onClick={() => router.push('/admin')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Go to Admin Panel
                </button>
              )}

              {result.user && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-xs text-gray-500 font-mono whitespace-pre-wrap">
                    {JSON.stringify(result.user, null, 2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}