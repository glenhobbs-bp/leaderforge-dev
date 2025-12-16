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

  // Fetch platform admins
  const { data: admins } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, is_platform_admin, created_at, last_sign_in_at')
    .eq('is_platform_admin', true)
    .order('created_at', { ascending: true });

  return (
    <PlatformAdminManagement 
      admins={admins || []} 
      currentUserId={user.id}
    />
  );
}
