"use client";
// File: apps/web/components/ui/AuthenticationGuard.tsx
// Purpose: Handles authentication checks, redirects, and loading states for authenticated pages
// Owner: Frontend Team
// Tags: #authentication #guard #loading #redirect

import React, { useEffect } from 'react';
import { useSupabase } from '../SupabaseProvider';

interface AuthenticationGuardProps {
  children: React.ReactNode;
  onAuthenticationChange?: (authenticated: boolean) => void;
}

export function AuthenticationGuard({ children, onAuthenticationChange }: AuthenticationGuardProps) {
  const { session, loading: authLoading } = useSupabase();

  // Authentication guard - redirect to login if no session and auth loading is complete
  useEffect(() => {
    // Only redirect if we're sure there's no session (not loading and no session)
    if (!authLoading && !session) {
      console.log('[AuthenticationGuard] No session found after auth loading complete, redirecting to login');
      // Add a small delay to prevent flash during normal loading sequences
      const redirectTimer = setTimeout(() => {
        window.location.href = '/login';
      }, 100);

      return () => clearTimeout(redirectTimer);
    }

    // Notify parent component of authentication changes
    if (onAuthenticationChange) {
      onAuthenticationChange(!!session);
    }
  }, [authLoading, session, onAuthenticationChange]);

  // Show loading state while authentication is being determined
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/leaderforge-logo.png" alt="LeaderForge" width={120} height={40} />
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-spinner"></div>
            <p className="mt-4 text-sm text-gray-600">Authenticating...</p>
          </div>
        </div>
      </div>
    );
  }

  // SYNC authentication check - redirect immediately if no session
  if (!authLoading && !session) {
    console.log('[AuthenticationGuard] No session - redirecting to login synchronously');
    window.location.href = '/login';
    return null; // Prevent any rendering
  }

  // Render children if authenticated
  return <>{children}</>;
}