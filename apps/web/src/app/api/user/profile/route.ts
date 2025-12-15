/**
 * File: src/app/api/user/profile/route.ts
 * Purpose: API route for user profile management
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/user/profile
 * Get current user's profile
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, tenant_id, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Get membership info
    const { data: membership } = await supabase
      .from('memberships')
      .select(`
        role,
        is_active,
        organizations!inner(id, display_name),
        teams(id, name)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        profile,
        membership,
      },
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Update current user's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fullName, avatarUrl } = body;

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (fullName !== undefined) {
      // Validate name
      if (typeof fullName !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid name format' },
          { status: 400 }
        );
      }
      
      const trimmedName = fullName.trim();
      if (trimmedName.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Name must be 100 characters or less' },
          { status: 400 }
        );
      }
      
      updates.full_name = trimmedName || null;
    }

    if (avatarUrl !== undefined) {
      // Allow null to clear avatar
      if (avatarUrl !== null && typeof avatarUrl !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid avatar URL format' },
          { status: 400 }
        );
      }
      updates.avatar_url = avatarUrl;
    }

    // Update user
    const { data: profile, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('id, email, full_name, avatar_url, updated_at')
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
