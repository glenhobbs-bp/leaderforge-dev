/**
 * File: src/app/(dashboard)/leaderboard/page.tsx
 * Purpose: Full leaderboard page with filtering options
 * Owner: Core Team
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LeaderboardPage } from './leaderboard-page';

export default async function Page() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  // Get user's membership for org name
  const { data: membership } = await supabase
    .from('memberships')
    .select(`
      organization_id,
      team_id,
      organizations!inner(display_name),
      teams(name)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const orgData = membership?.organizations as unknown as { display_name: string } | null;
  const teamData = membership?.teams as unknown as { name: string } | null;

  return (
    <LeaderboardPage 
      organizationName={orgData?.display_name || 'Your Organization'}
      teamName={teamData?.name}
      hasTeam={!!membership?.team_id}
    />
  );
}
