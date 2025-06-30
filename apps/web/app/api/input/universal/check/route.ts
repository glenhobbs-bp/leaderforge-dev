/**
 * Purpose: Check for existing worksheet submissions for a specific video and template
 * Owner: Universal Input System
 * Tags: [api, universal-input, worksheet, check-existing]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const templateId = searchParams.get('templateId');

    console.log('[UniversalInput/Check] Checking for existing submission:', { videoId, templateId });

    if (!videoId || !templateId) {
      return NextResponse.json(
        { error: 'Missing videoId or templateId parameters' },
        { status: 400 }
      );
    }

    // Session restoration (matching the working form-templates API pattern)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get access and refresh tokens from cookies
    const accessToken = request.cookies.get('sb-pcjaagjqydyqfsthsmac-auth-token')?.value;
    const refreshToken = request.cookies.get('sb-pcjaagjqydyqfsthsmac-refresh-token')?.value;

    console.log('[UniversalInput/Check] Cookie tokens found:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      projectRef: 'pcjaagjqydyqfsthsmac'
    });

    let session = null;
    let sessionError = null;

    if (accessToken && refreshToken) {
      console.log('[UniversalInput/Check] Attempting session restoration...');

      try {
        const setSessionRes = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (setSessionRes.error) {
          console.log('[UniversalInput/Check] setSession failed:', setSessionRes.error.message);
          sessionError = setSessionRes.error;
        } else {
          console.log('[UniversalInput/Check] Session restored successfully');
          session = setSessionRes.data.session;
        }
      } catch (error) {
        console.log('[UniversalInput/Check] Session restoration threw error:', (error as Error).message);
        sessionError = error;
      }
    } else {
      console.warn('[UniversalInput/Check] Missing access or refresh token in cookies');
    }

    // Final session check
    if (!session) {
      const { data: { session: currentSession }, error: currentError } = await supabase.auth.getSession();
      session = currentSession;
      if (currentError && !sessionError) {
        sessionError = currentError;
      }
    }

    console.log('[UniversalInput/Check] Final auth result:', {
      user: session?.user?.id,
      hasSession: !!session,
      error: sessionError?.message
    });

    if (sessionError || !session?.user) {
      console.error('[UniversalInput/Check] Authentication failed:', sessionError?.message || 'No session');
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    console.log('[UniversalInput/Check] Authenticated user:', session.user.id);

    // Query for existing submission
    const { data: existing, error: queryError } = await supabase
      .schema('core')
      .from('universal_inputs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('input_type', 'form')
      .like('source_context', `worksheet:video-reflection:${videoId}:%`)
      .contains('input_data', { template_id: templateId })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      console.error('[UniversalInput/Check] Query error:', queryError);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    if (existing) {
      console.log('[UniversalInput/Check] Found existing submission:', existing.id);
      return NextResponse.json({
        found: true,
        data: existing
      });
    } else {
      console.log('[UniversalInput/Check] No existing submission found');
      return NextResponse.json({
        found: false,
        data: null
      });
    }

  } catch (error) {
    console.error('[UniversalInput/Check] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}