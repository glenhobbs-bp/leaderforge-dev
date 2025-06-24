import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {}
        }
      }
    );

    const tests = [];

    // Test 1: Try core.user_progress (our target)
    try {
      const { data, error } = await supabase
        .schema('core')
        .from('user_progress')
        .select('*')
        .limit(1);
      tests.push({
        table: 'core.user_progress',
        success: !error,
        error: error?.message,
        dataCount: data?.length || 0
      });
    } catch (e) {
      tests.push({
        table: 'core.user_progress',
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      });
    }

    // Test 2: Try core.user_entitlements (from provisioningService)
    try {
      const { data, error } = await supabase
        .schema('core')
        .from('user_entitlements')
        .select('*')
        .limit(1);
      tests.push({
        table: 'core.user_entitlements',
        success: !error,
        error: error?.message,
        dataCount: data?.length || 0
      });
    } catch (e) {
      tests.push({
        table: 'core.user_entitlements',
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      });
    }

    // Test 3: Try core.users (should exist)
    try {
      const { data, error } = await supabase
        .schema('core')
        .from('users')
        .select('*')
        .limit(1);
      tests.push({
        table: 'core.users',
        success: !error,
        error: error?.message,
        dataCount: data?.length || 0
      });
    } catch (e) {
      tests.push({
        table: 'core.users',
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      });
    }

    // Test 4: Try users (without schema)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      tests.push({
        table: 'users',
        success: !error,
        error: error?.message,
        dataCount: data?.length || 0
      });
    } catch (e) {
      tests.push({
        table: 'users',
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      });
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tests
    });
  } catch (error) {
    console.error('Schema check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}