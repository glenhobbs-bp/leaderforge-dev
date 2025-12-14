/**
 * File: src/app/(auth)/invite/[token]/page.tsx
 * Purpose: Invitation acceptance page
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InviteForm } from './invite-form';

export const metadata: Metadata = {
  title: 'Accept Invitation',
  description: 'Accept your invitation to join LeaderForge',
};

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

async function getInvitation(token: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      organizations:organization_id (name),
      teams:team_id (name),
      invited_by_user:invited_by (full_name)
    `)
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invitation = await getInvitation(token);

  if (!invitation) {
    redirect('/login?error=invalid_invitation');
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">You&apos;re invited!</h2>
        <p className="text-muted-foreground">
          {invitation.invited_by_user?.full_name || 'Someone'} has invited you to join{' '}
          <span className="font-medium text-foreground">
            {invitation.organizations?.name}
          </span>
          {invitation.teams?.name && (
            <> on the <span className="font-medium text-foreground">{invitation.teams.name}</span> team</>
          )}
        </p>
      </div>

      <InviteForm 
        token={token} 
        email={invitation.email}
        role={invitation.role}
      />
    </div>
  );
}

