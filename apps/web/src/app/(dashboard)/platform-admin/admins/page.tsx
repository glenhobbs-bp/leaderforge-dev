/**
 * File: src/app/(dashboard)/platform-admin/admins/page.tsx
 * Purpose: Platform Admin management page
 * Owner: LeaderForge Team
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlatformAdminManagement } from './admin-management';

export default async function PlatformAdminsPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Verify platform admin
  const { data: userData } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_platform_admin) {
    redirect('/dashboard');
  }

  // Fetch platform admins using function that joins with auth.users for last_sign_in_at
  const { data: admins } = await supabase
    .schema('core')
    .rpc('get_platform_admins');

  return (
    <PlatformAdminManagement 
      admins={admins || []} 
      currentUserId={user.id}
    />
  );
}
