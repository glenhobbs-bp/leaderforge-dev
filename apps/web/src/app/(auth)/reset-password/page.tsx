/**
 * File: src/app/(auth)/reset-password/page.tsx
 * Purpose: Reset password page
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set your new LeaderForge password',
};

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Reset your password</h2>
        <p className="text-muted-foreground">
          Enter your new password below
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}

