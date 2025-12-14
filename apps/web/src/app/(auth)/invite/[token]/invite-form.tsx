/**
 * File: src/app/(auth)/invite/[token]/invite-form.tsx
 * Purpose: Invitation acceptance form
 * Owner: Core Team
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface InviteFormProps {
  token: string;
  email: string;
  role: string;
}

export function InviteForm({ token, email, role }: InviteFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const fullName = formData.get('fullName') as string;

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Sign up the user
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            invitation_token: token,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // Accept the invitation via API
      const response = await fetch(`/api/v1/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error?.message || 'Failed to accept invitation');
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          This email cannot be changed
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="John Doe"
          required
          autoComplete="name"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Must be at least 8 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          disabled={isLoading}
        />
      </div>

      <div className="bg-muted/50 rounded-md p-3 text-sm">
        <p className="text-muted-foreground">
          You&apos;ll be joining as a <span className="font-medium text-foreground capitalize">{role}</span>
        </p>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Accept invitation
      </Button>
    </form>
  );
}

