/**
 * File: src/app/(auth)/login/page.tsx
 * Purpose: Login page
 * Owner: Core Team
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your LeaderForge account',
};

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      {params.error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {params.error === 'invalid_credentials'
            ? 'Invalid email or password'
            : params.error === 'session_expired'
            ? 'Your session has expired. Please login again.'
            : 'An error occurred. Please try again.'}
        </div>
      )}

      <LoginForm redirectTo={params.redirect} />

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Need help?
            </span>
          </div>
        </div>

        <div className="flex flex-col space-y-2 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-primary hover:underline"
          >
            Forgot your password?
          </Link>
          <p className="text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

