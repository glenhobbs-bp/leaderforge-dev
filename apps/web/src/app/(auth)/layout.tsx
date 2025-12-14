/**
 * File: src/app/(auth)/layout.tsx
 * Purpose: Auth pages layout (centered card design)
 * Owner: Core Team
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if already logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">LeaderForge</h1>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md px-4">
        <div className="bg-card rounded-lg border shadow-lg p-8">
          {children}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} LeaderForge. All rights reserved.
      </p>
    </div>
  );
}

