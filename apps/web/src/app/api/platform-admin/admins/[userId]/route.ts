/**
 * File: src/app/api/platform-admin/admins/[userId]/route.ts
 * Purpose: Platform Admin API for managing individual platform administrators
 * Owner: LeaderForge Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * Verify the current user is a platform admin
 */
async function verifyPlatformAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: userData } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_platform_admin) {
    return { error: 'Forbidden - Platform Admin access required', status: 403 };
  }

  return { user, userData };
}

/**
 * DELETE /api/platform-admin/admins/[userId]
 * Remove platform admin status from a user
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    
    const auth = await verifyPlatformAdmin(supabase);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    // Prevent removing yourself
    if (userId === auth.user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot remove your own platform admin access' },
        { status: 400 }
      );
    }

    // Check that user exists and is a platform admin
    const { data: targetUser, error: findError } = await supabase
      .from('users')
      .select('id, email, full_name, is_platform_admin')
      .eq('id', userId)
      .single();

    if (findError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!targetUser.is_platform_admin) {
      return NextResponse.json(
        { success: false, error: 'User is not a platform admin' },
        { status: 400 }
      );
    }

    // Count remaining platform admins
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('is_platform_admin', true);

    if (count && count <= 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove the last platform admin' },
        { status: 400 }
      );
    }

    // Remove platform admin status
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_platform_admin: false })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove platform admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${targetUser.full_name || targetUser.email} is no longer a platform admin`,
    });
  } catch (error) {
    console.error('Platform Admins DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
