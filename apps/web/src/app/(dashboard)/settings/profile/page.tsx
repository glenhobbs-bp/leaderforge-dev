/**
 * File: src/app/(dashboard)/settings/profile/page.tsx
 * Purpose: User profile settings page
 * Owner: Core Team
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileSettings } from './profile-settings';

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Get user profile data
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, created_at')
    .eq('id', user.id)
    .single();

  // Get user's membership info
  const { data: membership } = await supabase
    .from('memberships')
    .select(`
      role,
      organizations!inner(display_name),
      teams(name)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const orgData = membership?.organizations as unknown as { display_name: string } | null;
  const teamData = membership?.teams as unknown as { name: string } | null;

  return (
    <ProfileSettings 
      profile={{
        id: profile?.id || user.id,
        email: profile?.email || user.email || '',
        fullName: profile?.full_name || '',
        avatarUrl: profile?.avatar_url || null,
        createdAt: profile?.created_at || user.created_at,
      }}
      membership={{
        role: membership?.role || 'member',
        organizationName: orgData?.display_name || null,
        teamName: teamData?.name || null,
      }}
    />
  );
}
