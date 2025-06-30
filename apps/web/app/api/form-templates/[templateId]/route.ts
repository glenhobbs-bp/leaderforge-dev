/**
 * Purpose: Form templates API endpoint for schema-driven forms
 * Owner: Schema-Driven Forms Implementation
 * Tags: [api, form-templates, database, supabase]
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';

interface FormTemplate {
  template_id: string;
  template_name: string;
  display_name: string;
  description: string;
  json_schema: Record<string, unknown>;
  ui_schema: Record<string, unknown>;
  scoring_schema?: Record<string, unknown>;
  estimated_completion_minutes?: number;
  requires_file_upload?: boolean;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with server-side rendering
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // ✅ Robust Session Restoration (same pattern as agent/content API)
    const allCookies = cookieStore.getAll();
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
    const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
    const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

    let session = null;
    let sessionError = null;

    // Try to restore session if tokens are present
    if (accessToken && refreshToken) {
      console.log('[FormTemplates API] Attempting session restoration...');

      try {
        const setSessionRes = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (setSessionRes.error) {
          console.log('[FormTemplates API] setSession failed:', setSessionRes.error.message);

          // If JWT is invalid, try refresh
          if (setSessionRes.error.message.includes('JWT') || setSessionRes.error.message.includes('expired')) {
            console.log('[FormTemplates API] Attempting token refresh...');

            const refreshRes = await supabase.auth.refreshSession();
            if (refreshRes.error) {
              console.log('[FormTemplates API] Token refresh failed:', refreshRes.error.message);
              sessionError = refreshRes.error;
            } else {
              console.log('[FormTemplates API] Token refresh successful');
              session = refreshRes.data.session;
            }
          } else {
            sessionError = setSessionRes.error;
          }
        } else {
          console.log('[FormTemplates API] Session restored successfully');
          session = setSessionRes.data.session;
        }
      } catch (error) {
        console.log('[FormTemplates API] Session restoration threw error:', error.message);
        sessionError = error;
      }
    } else {
      console.warn('[FormTemplates API] Missing access or refresh token in cookies');
    }

    // Final session check - try one more time to get current session
    if (!session) {
      const { data: { session: currentSession }, error: currentError } = await supabase.auth.getSession();
      session = currentSession;
      if (currentError && !sessionError) {
        sessionError = currentError;
      }
    }

    console.log('[FormTemplates API] Final auth result:', {
      user: session?.user?.id,
      hasSession: !!session,
      error: sessionError?.message
    });

    if (sessionError || !session?.user) {
      console.error('[FormTemplates API] Authentication failed:', sessionError?.message || 'No session');
      return NextResponse.json({
        error: 'Authentication required',
        details: {
          error: sessionError?.message || 'No session',
          cookieCount: allCookies.length,
          hasTokens: !!(accessToken && refreshToken)
        }
      }, { status: 401 });
    }

    // Fetch form template from database
    // This query respects RLS policies for tenant-specific templates
    const { data: template, error: dbError } = await supabase
      .schema('core')
      .from('form_templates')
      .select(`
        template_id,
        template_name,
        display_name,
        description,
        json_schema,
        ui_schema,
        scoring_schema,
        estimated_completion_minutes,
        requires_file_upload,
        category,
        is_active,
        created_at,
        updated_at
      `)
      .eq('template_id', templateId)
      .eq('is_active', true)
      .single();

    if (dbError) {
      console.error('[FormTemplates API] Database error:', dbError);

      if (dbError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Form template not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch form template' },
        { status: 500 }
      );
    }

    if (!template) {
      return NextResponse.json(
        { error: 'Form template not found' },
        { status: 404 }
      );
    }

    // Map database fields to FormWidget expected format
    const formattedTemplate = {
      id: template.template_id,
      name: template.display_name,
      description: template.description,
      schema: template.json_schema,
      ui_schema: template.ui_schema,
      agent_config: template.scoring_schema || {},
      scoring_schema: template.scoring_schema || {}
    };

    // Return the template
    return NextResponse.json(formattedTemplate);

  } catch (error) {
    console.error('[FormTemplates API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// List all available templates (for discovery)
export async function OPTIONS() {
  try {
    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // ✅ Use same robust authentication pattern
    const allCookies = cookieStore.getAll();
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
    const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
    const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

    let session = null;
    if (accessToken && refreshToken) {
      const setSessionRes = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (!setSessionRes.error) {
        session = setSessionRes.data.session;
      }
    }

    if (!session) {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      session = currentSession;
    }

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch all available templates (respects RLS)
    const { data: templates, error: dbError } = await supabase
      .schema('core')
      .from('form_templates')
      .select(`
        template_id,
        template_name,
        display_name,
        description,
        category,
        estimated_completion_minutes,
        requires_file_upload
      `)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('display_name', { ascending: true });

    if (dbError) {
      console.error('[FormTemplates API] Template list error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: templates || [] });

  } catch (error) {
    console.error('[FormTemplates API] Template list unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}