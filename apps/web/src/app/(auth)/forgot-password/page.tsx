/**
 * File: src/app/(auth)/forgot-password/page.tsx
 * Purpose: Forgot password page
 * Owner: Core Team
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your LeaderForge password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Forgot your password?</h2>
        <p className="text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <ForgotPasswordForm />

      <div className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

