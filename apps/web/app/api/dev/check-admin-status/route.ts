/**
 * File: apps/web/app/api/dev/check-admin-status/route.ts
 * Purpose: Development endpoint to check and update admin status
 * Owner: Engineering Team
 * Tags: #dev #admin #debug
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email') || 'glen@brilliantperspectives.com';
  const action = url.searchParams.get('action'); // 'check' or 'grant'

  try {
    // First check current status
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('user_id, email, is_admin, tenant_key')
      .eq('email', email)
      .single();

    if (fetchError) {
      return NextResponse.json({
        error: 'User not found',
        details: fetchError
      }, { status: 404 });
    }

    // If action is grant, update the user
    if (action === 'grant' && profile) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ is_admin: true })
        .eq('user_id', profile.user_id);

      if (updateError) {
        return NextResponse.json({
          error: 'Failed to update admin status',
          details: updateError
        }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Admin access granted',
        profile: { ...profile, is_admin: true }
      });
    }

    // Otherwise just return current status
    return NextResponse.json({
      profile,
      status: profile.is_admin ? 'User is admin' : 'User is NOT admin',
      hint: profile.is_admin ? null : 'Add ?action=grant to grant admin access'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error
    }, { status: 500 });
  }
}