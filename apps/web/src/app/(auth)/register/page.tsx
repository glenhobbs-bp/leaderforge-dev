/**
 * File: src/app/(auth)/register/page.tsx
 * Purpose: Registration page
 * Owner: Core Team
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from './register-form';

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create your LeaderForge account',
};

interface RegisterPageProps {
  searchParams: Promise<{ invitation?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Create an account</h2>
        <p className="text-muted-foreground">
          {params.invitation
            ? 'Complete your registration to join your team'
            : 'Enter your details to get started'}
        </p>
      </div>

      <RegisterForm invitationToken={params.invitation} />

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

