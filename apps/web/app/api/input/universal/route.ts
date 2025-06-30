/**
 * Purpose: Universal Input API - Handles all user input submissions in unified system
 * Owner: Universal Input System
 * Tags: [api, universal-input, agent-native, capture-once-derive-everything]
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Universal Input interfaces
interface UniversalInputRequest {
  input_type: 'form' | 'text' | 'voice' | 'image' | 'multimodal';
  input_data: Record<string, unknown>;
  source_context: string; // e.g., "worksheet:video-reflection:VIDEO_ID"
  context_type?: 'personal' | 'team' | 'platform' | 'chat';
  privacy_level?: 'encrypted' | 'user' | 'team' | 'org' | 'platform';
  requires_agent?: boolean;
  session_id?: string;
  update_existing?: boolean;
  existing_input_id?: string;
}

interface UniversalInputResponse {
  success: boolean;
  input_id?: string;
  processing_status: 'immediate' | 'queued' | 'error';
  derivations_triggered: string[];
  calculated_score?: number;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UniversalInputResponse>> {
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

    // ✅ Robust Session Restoration (same pattern as form-templates API)
    const allCookies = cookieStore.getAll();
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
    const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
    const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

    let session = null;
    let sessionError = null;

    // Try to restore session if tokens are present
    if (accessToken && refreshToken) {
      console.log('[UniversalInput API] Attempting session restoration...');

      try {
        const setSessionRes = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (setSessionRes.error) {
          console.log('[UniversalInput API] setSession failed:', setSessionRes.error.message);

          // If JWT is invalid, try refresh
          if (setSessionRes.error.message.includes('JWT') || setSessionRes.error.message.includes('expired')) {
            console.log('[UniversalInput API] Attempting token refresh...');

            const refreshRes = await supabase.auth.refreshSession();
            if (refreshRes.error) {
              console.log('[UniversalInput API] Token refresh failed:', refreshRes.error.message);
              sessionError = refreshRes.error;
            } else {
              console.log('[UniversalInput API] Token refresh successful');
              session = refreshRes.data.session;
            }
          } else {
            sessionError = setSessionRes.error;
          }
        } else {
          console.log('[UniversalInput API] Session restored successfully');
          session = setSessionRes.data.session;
        }
      } catch (error) {
        console.log('[UniversalInput API] Session restoration threw error:', (error as Error).message);
        sessionError = error;
      }
    } else {
      console.warn('[UniversalInput API] Missing access or refresh token in cookies');
    }

    // Final session check - try one more time to get current session
    if (!session) {
      const { data: { session: currentSession }, error: currentError } = await supabase.auth.getSession();
      session = currentSession;
      if (currentError && !sessionError) {
        sessionError = currentError;
      }
    }

    console.log('[UniversalInput API] Final auth result:', {
      user: session?.user?.id,
      hasSession: !!session,
      error: sessionError?.message
    });

    if (sessionError || !session?.user) {
      console.error('[UniversalInput API] Authentication failed:', sessionError?.message || 'No session');
      return NextResponse.json({
        success: false,
        processing_status: 'error',
        derivations_triggered: [],
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body: UniversalInputRequest = await request.json();

    // Validate required fields
    if (!body.input_type || !body.input_data || !body.source_context) {
      return NextResponse.json({
        success: false,
        processing_status: 'error',
        derivations_triggered: [],
        error: 'Missing required fields: input_type, input_data, source_context'
      }, { status: 400 });
    }

    // Auto-classify context_type if not provided
    const context_type = body.context_type || classifyContextType(body.source_context);

    // Auto-determine privacy_level if not provided
    const privacy_level = body.privacy_level || determinePrivacyLevel(context_type);

    // For worksheet submissions, calculate score immediately (hybrid approach)
    let calculated_score: number | undefined;
    if (body.source_context.startsWith('worksheet:video-reflection:')) {
      calculated_score = calculateWorksheetScore(body.input_data);

      // Add score to input_data for storage
      body.input_data = {
        ...body.input_data,
        calculated_score,
        scoring_version: '1.0',
        scored_at: new Date().toISOString()
      };
    }

    // Get tenant_key from user metadata or default
    const tenant_key = session.user.user_metadata?.tenant_key || 'leaderforge';

    let inputRecord;
    let dbError;

    // Handle update vs insert based on update_existing flag
    if (body.update_existing && body.existing_input_id) {
      console.log('[UniversalInput API] Updating existing submission:', body.existing_input_id);

      // Update existing record
      const { data: updateData, error: updateError } = await supabase
        .schema('core')
        .from('universal_inputs')
        .update({
          input_data: body.input_data,
          context_type,
          privacy_level,
          requires_agent: body.requires_agent || false,
          source_context: body.source_context,
          updated_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', body.existing_input_id)
        .eq('user_id', session.user.id) // Security: only allow updating own records
        .select()
        .single();

      inputRecord = updateData;
      dbError = updateError;
    } else {
      console.log('[UniversalInput API] Creating new submission');

      // Insert new record
      const { data: insertData, error: insertError } = await supabase
        .schema('core')
        .from('universal_inputs')
        .insert({
          user_id: session.user.id,
          session_id: body.session_id || generateSessionId(),
          input_type: body.input_type,
          input_data: body.input_data,
          context_type,
          privacy_level,
          requires_agent: body.requires_agent || false,
          source_context: body.source_context,
          tenant_key,
          status: 'completed' // Mark as completed immediately for worksheets
        })
        .select()
        .single();

      inputRecord = insertData;
      dbError = insertError;
    }

    if (dbError) {
      console.error('[UniversalInput] Database operation error:', {
        error: dbError,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
        operation: body.update_existing ? 'update' : 'insert'
      });
      return NextResponse.json({
        success: false,
        processing_status: 'error',
        derivations_triggered: [],
        error: `Failed to ${body.update_existing ? 'update' : 'store'} input: ${dbError.message || 'Unknown database error'}`
      }, { status: 500 });
    }

    // Determine what derivations will be triggered
    const derivations_triggered = getDerivedSystems(body.source_context);

    // If requires agent processing, queue it (for future implementation)
    let processing_status: 'immediate' | 'queued' | 'error' = 'immediate';
    if (body.requires_agent) {
      // For MVP, we'll mark as immediate but could queue for actual agent processing
      processing_status = 'immediate';

      // TODO: Queue agent processing
      // await queueAgentProcessing(inputRecord.id, body.source_context);
    }

    return NextResponse.json({
      success: true,
      input_id: inputRecord.id,
      processing_status,
      derivations_triggered,
      calculated_score,
    });

  } catch (error) {
    console.error('[UniversalInput] API error:', error);
    return NextResponse.json({
      success: false,
      processing_status: 'error',
      derivations_triggered: [],
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Helper functions
function classifyContextType(source_context: string): 'personal' | 'team' | 'platform' | 'chat' {
  if (source_context.startsWith('worksheet:')) return 'team';
  if (source_context.startsWith('journal:')) return 'personal';
  if (source_context.startsWith('feedback:') || source_context.startsWith('bug:')) return 'platform';
  if (source_context.startsWith('chat:')) return 'chat';
  return 'team'; // default
}

function determinePrivacyLevel(context_type: string): 'encrypted' | 'user' | 'team' | 'org' | 'platform' {
  switch (context_type) {
    case 'personal': return 'user';
    case 'team': return 'team';
    case 'platform': return 'platform';
    case 'chat': return 'team';
    default: return 'team';
  }
}

function calculateWorksheetScore(input_data: Record<string, unknown>): number {
  let score = 50; // Base completion points

  const responses = input_data.responses as Record<string, unknown>;
  if (!responses) return score;

  // Quality scoring
  if (responses.insights && Array.isArray(responses.insights)) {
    score += responses.insights.length * 10; // 10 points per insight
  }

  if (responses.big_idea && typeof responses.big_idea === 'string') {
    if (responses.big_idea.length >= 100) score += 20;
  }

  if (responses.bold_action && typeof responses.bold_action === 'string') {
    if (responses.bold_action.length >= 50) score += 15;
  }

  // Future ideas bonus
  if (responses.future_ideas && Array.isArray(responses.future_ideas)) {
    const futureIdeasCount = responses.future_ideas.filter(idea =>
      typeof idea === 'string' && idea.trim().length > 0
    ).length;
    if (futureIdeasCount > 1) {
      score += (futureIdeasCount - 1) * 5;
    }
  }

  return score;
}

function getDerivedSystems(source_context: string): string[] {
  const derivations: string[] = [];

  if (source_context.startsWith('worksheet:video-reflection:')) {
    derivations.push('progress_tracking', 'leaderboard', 'video_completion');
  }

  if (source_context.startsWith('journal:')) {
    derivations.push('personal_insights', 'mood_tracking');
  }

  if (source_context.startsWith('feedback:') || source_context.startsWith('bug:')) {
    derivations.push('admin_notifications', 'issue_tracking');
  }

  return derivations;
}

function generateSessionId(): string {
  return globalThis.crypto.randomUUID();
}