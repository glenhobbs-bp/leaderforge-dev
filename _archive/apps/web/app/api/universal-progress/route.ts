/**
 * Universal Progress API - Authenticated Endpoint
 * Purpose: Handle progress tracking with proper SSR authentication
 * Owner: Senior Engineering Team
 * Tags: progress-tracking, api-endpoint, authenticated
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies as nextCookies } from 'next/headers';
import { createSupabaseServerClient } from '../../lib/supabaseServerClient';
import { UserProgressTool, SupabaseUserProgressRepository } from '../../../../../packages/agent-core/tools/UserProgressTool';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, contentId, contextKey, progressData, watchTime, position, duration, score, totalQuestions, answeredQuestions, scrollPosition, highlights, event, contentIds, events } = body;

    // Get user session for authentication (using same method as agent/content route)
    const cookieStore = await nextCookies();
    const allCookies = cookieStore.getAll();
    console.log('[Universal Progress API] Cookies available:', allCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 10) + '...' })));

    // Extract tokens like the agent/content route does
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
    const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
    const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;
    console.log('[Universal Progress API] Extracted tokens:', { accessToken: accessToken ? 'present' : 'missing', refreshToken: refreshToken ? 'present' : 'missing' });

    const supabase = createSupabaseServerClient(cookieStore);

    // Manually restore session if tokens are present
    if (accessToken && refreshToken) {
      const setSessionRes = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      console.log('[Universal Progress API] setSession result:', setSessionRes.error ? { error: setSessionRes.error } : 'success');
    } else {
      console.warn('[Universal Progress API] Missing access or refresh token in cookies');
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[Universal Progress API] Auth result:', { user: session?.user?.id, error: sessionError });

    if (sessionError || !session?.user) {
      console.error('[Universal Progress API] Auth error:', sessionError);
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        details: {
          error: sessionError?.message || 'No session',
          cookieCount: allCookies.length
        }
      }, { status: 401 });
    }

    const user = session.user;

    // Use the authenticated user's ID if no userId provided, or verify if userId matches
    const effectiveUserId = userId || user.id;
    if (userId && userId !== user.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized access to user data'
      }, { status: 403 });
    }

    console.log('[Universal Progress API] Proceeding with authenticated user:', {
      effectiveUserId,
      action,
      contentId: contentId || 'N/A',
      contextKey: contextKey || 'N/A'
    });

    // Create UserProgressTool with the authenticated SSR client (like rest of platform)
    const progressRepository = new SupabaseUserProgressRepository(supabase);
    const userProgressTool = new UserProgressTool(progressRepository);

    // Route to appropriate UserProgressTool method
    switch (action) {
      case 'trackVideoProgress': {
        const result = await userProgressTool.trackVideoProgress(
          effectiveUserId,
          contentId,
          contextKey,
          watchTime,
          position,
          duration
        );
        return NextResponse.json({ success: true, data: result });
      }

      case 'trackQuizCompletion': {
        const result = await userProgressTool.trackQuizCompletion(
          effectiveUserId,
          contentId,
          contextKey,
          score,
          totalQuestions,
          answeredQuestions
        );
        return NextResponse.json({ success: true, data: result });
      }

      case 'trackReadingProgress': {
        const result = await userProgressTool.trackReadingProgress(
          effectiveUserId,
          contentId,
          contextKey,
          scrollPosition,
          highlights
        );
        return NextResponse.json({ success: true, data: result });
      }

      case 'trackProgressEvent': {
        const result = await userProgressTool.trackProgressEvent(event);
        return NextResponse.json({ success: true, data: result });
      }

      case 'getProgress': {
        const result = await userProgressTool.getProgress(effectiveUserId, contentId, contextKey);
        return NextResponse.json({ success: true, data: result });
      }

      case 'setProgress': {
        const result = await userProgressTool.setProgress(effectiveUserId, contentId, contextKey, progressData);
        return NextResponse.json({ success: true, data: result });
      }

      case 'listProgress':
      case 'getProgressForContentIds': {
        const result = await userProgressTool.listProgressForContentIds(effectiveUserId, contentIds || [], contextKey);
        return NextResponse.json({ success: true, data: result });
      }

      case 'getProgressSummary': {
        const result = await userProgressTool.getProgressSummary(effectiveUserId, contextKey);
        return NextResponse.json({ success: true, data: result });
      }

      case 'getCompletionStats': {
        const result = await userProgressTool.getCompletionStats(effectiveUserId, contextKey);
        return NextResponse.json({ success: true, data: result });
      }

      case 'checkMilestones': {
        const result = await userProgressTool.checkMilestones(effectiveUserId, contextKey);
        return NextResponse.json({ success: true, data: result });
      }

      case 'batchTrackProgress': {
        const result = await userProgressTool.batchTrackProgress(events);
        return NextResponse.json({ success: true, data: result });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[Universal Progress API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}