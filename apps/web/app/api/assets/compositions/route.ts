/**
 * Purpose: Asset Compositions API - Hierarchical context-aware layouts
 * Owner: Asset System
 * Tags: [api, compositions, context, hierarchy]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies } from 'next/headers';

interface CompositionQuery {
  context_level?: 'leaderforge' | 'tenant' | 'team' | 'individual';
  context_id?: string;
  type?: 'layout' | 'workflow' | 'template';
  template?: boolean;
  scope?: 'private' | 'team' | 'tenant' | 'public';
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query: CompositionQuery = {
      context_level: searchParams.get('context_level') as CompositionQuery['context_level'] || undefined,
      context_id: searchParams.get('context_id') || undefined,
      type: searchParams.get('type') as CompositionQuery['type'] || undefined,
      template: searchParams.get('template') === 'true',
      scope: searchParams.get('scope') as CompositionQuery['scope'] || undefined,
    };

    // Build query with filters
    let queryBuilder = supabase
      .from('compositions')
      .select(`
        *,
        creator:created_by(id, full_name),
        user_compositions(
          id,
          customizations,
          usage_metrics,
          is_active,
          last_used_at
        )
      `)
      .order('updated_at', { ascending: false });

    // Apply filters
    if (query.context_level) {
      queryBuilder = queryBuilder.eq('context_level', query.context_level);
    }

    if (query.context_id) {
      queryBuilder = queryBuilder.eq('context_id', query.context_id);
    }

    if (query.type) {
      queryBuilder = queryBuilder.eq('composition_type', query.type);
    }

    if (query.template !== undefined) {
      queryBuilder = queryBuilder.eq('is_template', query.template);
    }

    if (query.scope) {
      queryBuilder = queryBuilder.eq('sharing_scope', query.scope);
    }

    const { data: compositions, error } = await queryBuilder;

    if (error) {
      console.error('Compositions query error:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    return NextResponse.json({
      compositions: compositions || [],
      total: compositions?.length || 0,
      filters: query
    });

  } catch (error) {
    console.error('Compositions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      context_level,
      context_id,
      composition_type = 'layout',
      schema_definition,
      activation_rules = {},
      inheritance_parent,
      is_template = false,
      sharing_scope = 'private'
    } = body;

    // Validate required fields
    if (!name || !context_level || !schema_definition) {
      return NextResponse.json({
        error: 'Missing required fields: name, context_level, schema_definition'
      }, { status: 400 });
    }

    // Create composition
    const { data: composition, error } = await supabase
      .from('compositions')
      .insert({
        name,
        description,
        context_level,
        context_id,
        composition_type,
        schema_definition,
        activation_rules,
        inheritance_parent,
        is_template,
        sharing_scope,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Composition creation error:', error);
      return NextResponse.json({ error: 'Failed to create composition' }, { status: 500 });
    }

    return NextResponse.json({ composition }, { status: 201 });

  } catch (error) {
    console.error('Composition creation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}