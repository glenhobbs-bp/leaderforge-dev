import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../lib/supabaseServerClient';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('[DEBUG] Checking user_progress table structure...');

    // Try to get a sample record to see what columns exist
    const { data: sampleData, error: sampleError } = await supabase
      .schema('core')
      .from('user_progress')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('[DEBUG] Error querying core.user_progress:', sampleError);

      // Try public schema
      const { data: publicData, error: publicError } = await supabase
        .from('user_progress')
        .select('*')
        .limit(1);

      if (publicError) {
        console.log('[DEBUG] Error querying public.user_progress:', publicError);
        return NextResponse.json({
          error: 'Could not access user_progress table',
          coreError: sampleError,
          publicError: publicError
        }, { status: 500 });
      }

      return NextResponse.json({
        schema: 'public',
        columns: publicData && publicData.length > 0 ? Object.keys(publicData[0]) : [],
        sampleRecord: publicData && publicData.length > 0 ? publicData[0] : null,
        rowCount: publicData ? publicData.length : 0
      });
    }

    return NextResponse.json({
      schema: 'core',
      columns: sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [],
      sampleRecord: sampleData && sampleData.length > 0 ? sampleData[0] : null,
      rowCount: sampleData ? sampleData.length : 0
    });

  } catch (error) {
    console.error('[DEBUG] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}