"use client";
// File: apps/web/components/ui/AuthenticationGuard.tsx
// Purpose: Handles authentication checks, redirects, and loading states for authenticated pages
// Owner: Frontend Team
// Tags: #authentication #guard #loading #redirect

import React, { useEffect, useState } from 'react';
import { useSupabase } from '../SupabaseProvider';

interface AuthenticationGuardProps {
  children: React.ReactNode;
  onAuthenticationChange?: (authenticated: boolean) => void;
}

export function AuthenticationGuard({ children, onAuthenticationChange }: AuthenticationGuardProps) {
  const { session, loading: authLoading } = useSupabase();
  const [isHydrating, setIsHydrating] = useState(true);

  // Give a brief grace period for SSR hydration to prevent login screen flash
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrating(false);
    }, 300); // Short grace period for session hydration

    return () => window.clearTimeout(timer);
  }, []);

  // Simplified authentication check - only redirect when we're certain there's no session
  useEffect(() => {
    // Notify parent component of authentication changes
    if (onAuthenticationChange) {
      onAuthenticationChange(!!session);
    }

    // Only redirect if we're past hydration period, not loading, and have no session
    if (!isHydrating && !authLoading && !session) {
      console.log('[AuthenticationGuard] No session found after hydration - redirecting to login');
      window.location.href = '/login';
    }
  }, [isHydrating, authLoading, session, onAuthenticationChange]);

  // Show loading state during auth loading OR hydration period
  if (authLoading || isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/leaderforge-logo.png" alt="LeaderForge" width={120} height={40} />
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-spinner"></div>
            <p className="mt-4 text-sm text-gray-600">
              {isHydrating ? 'Loading...' : 'Authenticating...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If no session after hydration and not loading, redirect will happen in useEffect
  if (!session) {
    return null;
  }

  // Render children if authenticated
  return <>{children}</>;
}