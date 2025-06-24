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

    // Test 1: Check if user_progress view exists
    console.log('Testing user_progress view access...');
    const { data: viewData, error: viewError } = await supabase
      .from('user_progress')
      .select('*')
      .limit(1);

    const result: any = {
      timestamp: new Date().toISOString(),
      tests: {
        viewAccess: {
          success: !viewError,
          error: viewError?.message,
          dataCount: viewData?.length || 0
        }
      }
    };

    // Test 2: Try to insert a test record
    const testUserId = 'test-user-123';
    const testRecord = {
      user_id: testUserId,
      content_id: 'test-content-123',
      context_key: 'test-context',
      progress_type: 'video' as const,
      progress_percentage: 25,
      completion_count: 0,
      total_sessions: 1,
      started_at: new Date().toISOString(),
      last_viewed_at: new Date().toISOString(),
      metadata: { test: 'data' },
      sync_status: 'synced' as const,
      last_synced_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('user_progress')
      .insert(testRecord)
      .select()
      .single();

    result.tests.insertTest = {
      success: !insertError,
      error: insertError?.message,
      insertedId: insertData?.id
    };

    // Test 3: Try to fetch the inserted record
    if (insertData?.id) {
      const { data: fetchData, error: fetchError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('id', insertData.id)
        .single();

      result.tests.fetchTest = {
        success: !fetchError,
        error: fetchError?.message,
        data: fetchData
      };

      // Clean up test record
      await supabase
        .from('user_progress')
        .delete()
        .eq('id', insertData.id);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Table access test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}