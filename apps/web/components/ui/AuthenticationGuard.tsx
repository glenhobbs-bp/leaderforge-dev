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
    if (!authLoading && !session) {
      console.log('[AuthenticationGuard] No session found, redirecting to login');
      window.location.href = '/login';
      return;
    }

    // Notify parent component of authentication changes
    if (onAuthenticationChange) {
      onAuthenticationChange(!!session);
    }
  }, [authLoading, session, onAuthenticationChange]);

  // SYNC authentication check - redirect immediately if no session
  if (!authLoading && !session) {
    console.log('[AuthenticationGuard] No session - redirecting to login synchronously');
    window.location.href = '/login';
    return null; // Prevent any rendering
  }

  // Show loading state while waiting for auth
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/leaderforge-icon-large.png" alt="LeaderForge" width={48} height={48} />
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-spinner mb-4"></div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Authenticating...
            </p>
            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
              Verifying your credentials...
            </p>
            <div className="mt-4 flex space-x-1">
              <div className="w-2 h-2 bg-primary-dot rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-secondary-dot rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-accent-dot rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
}