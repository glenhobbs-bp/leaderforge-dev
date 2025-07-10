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

  // Simplified authentication check - only redirect when we're certain there's no session
  useEffect(() => {
    // Notify parent component of authentication changes
    if (onAuthenticationChange) {
      onAuthenticationChange(!!session);
    }

    // Only redirect if we have a definitive "no session" state
    if (!authLoading && !session) {
      console.log('[AuthenticationGuard] No session found - redirecting to login');
      window.location.href = '/login';
    }
  }, [authLoading, session, onAuthenticationChange]);

  // Show loading state only if we're actually loading
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

  // If no session and not loading, redirect will happen in useEffect
  if (!session) {
    return null;
  }

  // Render children if authenticated
  return <>{children}</>;
}