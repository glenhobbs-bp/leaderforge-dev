/**
 * Database Debug API - Test RLS Policies
 * Purpose: Debug database access and RLS policies for user_progress table
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies as nextCookies } from 'next/headers';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await nextCookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // Get session info
    const { data: session, error: sessionError } = await supabase.auth.getSession();

    console.log('[DB Debug] Session info:', {
      hasSession: !!session.session,
      userId: session.session?.user?.id,
      sessionError: sessionError?.message
    });

    if (!session.session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'No session found',
        debug: { sessionError: sessionError?.message }
      }, { status: 401 });
    }

    const userId = session.session.user.id;

    // Test 1: Check if table exists
    try {
      const { data: tableCheck, error: tableError } = await supabase
        .schema('core')
        .from('user_progress')
        .select('count(*)')
        .limit(1);

      console.log('[DB Debug] Table check:', { tableCheck, tableError });
    } catch (error) {
      console.log('[DB Debug] Table access error:', error);
    }

    // Test 2: Check auth.uid() value
    try {
      const { data: authCheck, error: authError } = await supabase
        .rpc('get_auth_uid');

      console.log('[DB Debug] Auth UID check:', { authCheck, authError });
    } catch (error) {
      console.log('[DB Debug] Auth check not available:', error);
    }

    // Test 3: Try to select from user_progress table
    try {
      const { data: selectData, error: selectError } = await supabase
        .schema('core')
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .limit(5);

      console.log('[DB Debug] Select test:', {
        rowCount: selectData?.length || 0,
        selectError: selectError?.message
      });
    } catch (error) {
      console.log('[DB Debug] Select test error:', error);
    }

    // Test 4: Try to insert a test record
    try {
      const testRecord = {
        user_id: userId,
        content_id: 'test-content-debug',
        tenant_key: 'debug',
        progress_type: 'video',
        progress_percentage: 1,
        metadata: { debug: true }
      };

      const { data: insertData, error: insertError } = await supabase
        .schema('core')
        .from('user_progress')
        .upsert([testRecord], { onConflict: 'user_id,content_id,tenant_key' })
        .select()
        .single();

      console.log('[DB Debug] Insert test:', {
        insertSuccess: !!insertData,
        insertError: insertError?.message
      });
    } catch (error) {
      console.log('[DB Debug] Insert test error:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Debug complete - check server logs',
      userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DB Debug] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}