/**
 * File: src/app/(dashboard)/admin/learning-path/page.tsx
 * Purpose: Admin page for configuring organization learning paths
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchContentCollection } from '@/lib/tribe-social';
import { LearningPathConfig } from '@/components/admin/learning-path-config';

export const metadata: Metadata = {
  title: 'Learning Path',
  description: 'Configure your organization learning path and module sequencing',
};

export default async function AdminLearningPathPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Get user's membership and check admin role
  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!membership || !['admin', 'owner'].includes(membership.role)) {
    redirect('/dashboard');
  }

  // Get organization name for display
  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', membership.organization_id)
    .single();

  // Fetch available content for learning path configuration
  const contentModules = await fetchContentCollection();

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Learning Path</h1>
        <p className="text-muted-foreground mt-1">
          Configure module sequencing and unlock rules for {organization?.name || 'your organization'}
        </p>
      </div>

      {/* Learning Path Configuration */}
      <LearningPathConfig availableContent={contentModules} />
    </div>
  );
}
