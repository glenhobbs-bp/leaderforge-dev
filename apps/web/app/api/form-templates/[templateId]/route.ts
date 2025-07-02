/**
 * Purpose: Form templates API endpoint for schema-driven forms - PERFORMANCE OPTIMIZED
 * Owner: Schema-Driven Forms Implementation
 * Tags: [api, form-templates, database, supabase, cached]
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '@/lib/supabaseServerClient';

interface FormattedTemplate {
  id: string;
  name: string;
  description: string;
  schema: Record<string, unknown>;
  ui_schema: Record<string, unknown>;
  agent_config: Record<string, unknown>;
  scoring_schema: Record<string, unknown>;
}

// ✅ PERFORMANCE: Simple in-memory cache for form templates
const templateCache = new Map<string, { data: FormattedTemplate; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const startTime = Date.now();

  try {
    const { templateId } = await params;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // ✅ PERFORMANCE: Check cache first
    const cached = templateCache.get(templateId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`[FormTemplates] Cache hit for ${templateId} in ${Date.now() - startTime}ms`);
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 minutes
          'X-Cache': 'HIT',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      });
    }

    // ✅ PERFORMANCE: Robust authentication with proper cookie handling
    const cookieStore = await cookies();
    const { session, supabase, error: authError } = await restoreSession(cookieStore);

    if (!session?.user || authError) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    // ✅ PERFORMANCE: Simple database query with optimized select
    const { data: template, error: dbError } = await supabase
      .schema('core')
      .from('form_templates')
      .select(`
        template_id,
        display_name,
        description,
        json_schema,
        ui_schema,
        scoring_schema
      `)
      .eq('template_id', templateId)
      .eq('is_active', true)
      .single();

    if (dbError?.code === 'PGRST116' || !template) {
      return NextResponse.json(
        { error: 'Form template not found' },
        { status: 404 }
      );
    }

    if (dbError) {
      console.error('[FormTemplates API] Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch form template' },
        { status: 500 }
      );
    }

    // ✅ PERFORMANCE: Simplified response format
    const formattedTemplate = {
      id: template.template_id,
      name: template.display_name,
      description: template.description,
      schema: template.json_schema,
      ui_schema: template.ui_schema,
      agent_config: template.scoring_schema || {},
      scoring_schema: template.scoring_schema || {}
    };

    // ✅ PERFORMANCE: Cache the response
    templateCache.set(templateId, {
      data: formattedTemplate,
      timestamp: Date.now()
    });

    const responseTime = Date.now() - startTime;
    console.log(`[FormTemplates] Template ${templateId} fetched in ${responseTime}ms`);

    return NextResponse.json(formattedTemplate, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'X-Cache': 'MISS',
        'X-Response-Time': `${responseTime}ms`
      }
    });

  } catch (error) {
    console.error('[FormTemplates API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ✅ PERFORMANCE: Simplified OPTIONS endpoint
export async function OPTIONS() {
  return NextResponse.json({
    message: 'Form templates API',
    cache_status: `${templateCache.size} templates cached`
  });
}