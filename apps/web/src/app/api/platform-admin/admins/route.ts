/**
 * File: src/app/api/platform-admin/admins/route.ts
 * Purpose: Platform Admin API for managing platform administrators
 * Owner: LeaderForge Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
 * GET /api/platform-admin/admins
 * List all platform administrators
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    const auth = await verifyPlatformAdmin(supabase);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    // Fetch all platform admins using function that joins with auth.users
    const { data: admins, error } = await supabase
      .schema('core')
      .rpc('get_platform_admins');

    if (error) {
      console.error('Error fetching platform admins:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch platform admins' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        admins: admins || [],
        total: admins?.length || 0,
      },
    });
  } catch (error) {
    console.error('Platform Admins GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/platform-admin/admins
 * Add a user as platform admin (by email)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const auth = await verifyPlatformAdmin(supabase);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id, email, full_name, is_platform_admin')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (findError || !existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found. They must have an account first.' },
        { status: 404 }
      );
    }

    if (existingUser.is_platform_admin) {
      return NextResponse.json(
        { success: false, error: 'User is already a platform admin' },
        { status: 409 }
      );
    }

    // Update user to be platform admin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ is_platform_admin: true })
      .eq('id', existingUser.id)
      .select('id, email, full_name, avatar_url, is_platform_admin, created_at')
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to add platform admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `${existingUser.full_name || existingUser.email} is now a platform admin`,
    });
  } catch (error) {
    console.error('Platform Admins POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
