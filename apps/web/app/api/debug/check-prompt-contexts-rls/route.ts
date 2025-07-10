/**
 * Debug API to check and fix RLS policies on core.prompt_contexts table
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../lib/supabaseServerClient';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[DEBUG] Checking RLS policies on core.prompt_contexts...');

    // Check current RLS policies
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT
              schemaname,
              tablename,
              policyname,
              permissive,
              roles,
              cmd,
              qual,
              with_check
          FROM pg_policies
          WHERE schemaname = 'core' AND tablename = 'prompt_contexts'
          ORDER BY policyname;
        `
      });

    console.log('[DEBUG] Current policies:', policies);
    console.log('[DEBUG] Policies error:', policiesError);

    // Check if RLS is enabled
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT
              schemaname,
              tablename,
              rowsecurity as rls_enabled
          FROM pg_tables
          WHERE schemaname = 'core' AND tablename = 'prompt_contexts';
        `
      });

    console.log('[DEBUG] RLS Status:', rlsStatus);
    console.log('[DEBUG] RLS Error:', rlsError);

    // Check table existence and structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT
              column_name,
              data_type,
              is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'core' AND table_name = 'prompt_contexts'
          ORDER BY ordinal_position;
        `
      });

    console.log('[DEBUG] Table structure:', tableInfo);
    console.log('[DEBUG] Table error:', tableError);

    return NextResponse.json({
      success: true,
      policies: policies || [],
      rlsStatus: rlsStatus || [],
      tableInfo: tableInfo || [],
      errors: {
        policies: policiesError,
        rls: rlsError,
        table: tableError
      }
    });

  } catch (error) {
    console.error('[DEBUG] Error checking RLS policies:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    console.log('[DEBUG] Fixing RLS policies with action:', action);

    if (action === 'create_basic_policies') {
      // Create basic RLS policies for prompt_contexts
      const { data: result, error } = await supabase
        .rpc('exec_sql', {
          sql: `
            -- Enable RLS if not already enabled
            ALTER TABLE core.prompt_contexts ENABLE ROW LEVEL SECURITY;

            -- Drop existing policies if they exist
            DROP POLICY IF EXISTS "prompt_contexts_select" ON core.prompt_contexts;
            DROP POLICY IF EXISTS "prompt_contexts_insert" ON core.prompt_contexts;
            DROP POLICY IF EXISTS "prompt_contexts_update" ON core.prompt_contexts;
            DROP POLICY IF EXISTS "prompt_contexts_delete" ON core.prompt_contexts;

            -- Create basic policies for authenticated users
            CREATE POLICY "prompt_contexts_select" ON core.prompt_contexts
                FOR SELECT USING (
                    -- Global and organizational contexts are visible to all authenticated users
                    context_type IN ('global', 'organizational')
                    OR
                    -- Personal contexts are only visible to their creators
                    (context_type = 'personal' AND created_by = auth.uid())
                    OR
                    -- Team contexts require team membership (simplified for now)
                    context_type = 'team'
                );

            CREATE POLICY "prompt_contexts_insert" ON core.prompt_contexts
                FOR INSERT WITH CHECK (
                    -- Users can only create personal contexts initially
                    context_type = 'personal' AND created_by = auth.uid()
                );

            CREATE POLICY "prompt_contexts_update" ON core.prompt_contexts
                FOR UPDATE USING (
                    -- Users can only update their own personal contexts
                    context_type = 'personal' AND created_by = auth.uid()
                );

            CREATE POLICY "prompt_contexts_delete" ON core.prompt_contexts
                FOR DELETE USING (
                    -- Users can only delete their own personal contexts
                    context_type = 'personal' AND created_by = auth.uid()
                );

            -- Grant necessary permissions
            GRANT SELECT, INSERT, UPDATE, DELETE ON core.prompt_contexts TO authenticated;
          `
        });

      console.log('[DEBUG] Policy creation result:', result);
      console.log('[DEBUG] Policy creation error:', error);

      return NextResponse.json({
        success: !error,
        result,
        error: error?.message
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown action'
    }, { status: 400 });

  } catch (error) {
    console.error('[DEBUG] Error fixing RLS policies:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}