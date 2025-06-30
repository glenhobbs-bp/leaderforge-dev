/**
 * Purpose: Mockup Feedback API - Handles submission and retrieval of mockup feedback
 * Owner: Mockup System
 * Tags: [api, feedback, mockup, agent-native]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Types for feedback submission
interface MockupFeedbackRequest {
  mockupName: string;
  agentId?: string;
  rating: number;
  feedback: string;
  tenantKey: string;
  sessionId?: string;
  userAgent?: string;
  deviceInfo?: Record<string, unknown>;
}

interface MockupFeedbackResponse {
  success: boolean;
  id?: string;
  message: string;
  error?: string;
}

// Initialize Supabase client with service role for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// POST - Submit new feedback
export async function POST(request: NextRequest): Promise<NextResponse<MockupFeedbackResponse>> {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
        error: 'NO_AUTH'
      }, { status: 401 });
    }

    // Verify session and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(sessionToken);

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid authentication',
        error: 'INVALID_AUTH'
      }, { status: 401 });
    }

    // Parse request body
    const body: MockupFeedbackRequest = await request.json();

    // Validate required fields
    if (!body.mockupName || !body.rating || !body.feedback || !body.tenantKey) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: mockupName, rating, feedback, tenantKey',
        error: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Validate rating range
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json({
        success: false,
        message: 'Rating must be between 1 and 5',
        error: 'INVALID_RATING'
      }, { status: 400 });
    }

        // Get client IP address
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Prepare feedback data
    const feedbackData = {
      user_id: user.id,
      mockup_name: body.mockupName,
      agent_id: body.agentId || null,
      rating: body.rating,
      feedback_text: body.feedback,
      tenant_key: body.tenantKey,
      session_id: body.sessionId || null,
      user_agent: body.userAgent || request.headers.get('user-agent') || null,
      ip_address: clientIP,
      device_info: body.deviceInfo || {},
      status: 'new'
    };

    // Insert feedback into database
    const { data: feedbackResult, error: insertError } = await supabase
      .from('mockup_feedback')
      .insert(feedbackData)
      .select('id')
      .single();

    if (insertError) {
      console.error('[API/feedback/mockup] Database insert error:', insertError);

      // Handle duplicate submission
      if (insertError.code === '23505') {
        return NextResponse.json({
          success: false,
          message: 'You have already submitted feedback for this mockup',
          error: 'DUPLICATE_FEEDBACK'
        }, { status: 409 });
      }

      return NextResponse.json({
        success: false,
        message: 'Failed to save feedback',
        error: 'DATABASE_ERROR'
      }, { status: 500 });
    }

    // Log successful submission
    console.log('[API/feedback/mockup] New feedback submitted:', {
      feedbackId: feedbackResult.id,
      mockupName: body.mockupName,
      userId: user.id,
      rating: body.rating
    });

    return NextResponse.json({
      success: true,
      id: feedbackResult.id,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('[API/feedback/mockup] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// GET - Retrieve feedback for analytics (admin only)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const mockupName = searchParams.get('mockup');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user from session
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(sessionToken);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Check if user has admin permissions (extend as needed)
    // For now, allow any authenticated user to view aggregated analytics

    let query = supabase
      .from('recent_mockup_feedback')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (mockupName) {
      query = query.eq('mockup_name', mockupName);
    }

    const { data: feedback, error: queryError } = await query;

    if (queryError) {
      console.error('[API/feedback/mockup] Query error:', queryError);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    // Also get summary statistics
    const { data: analytics, error: analyticsError } = await supabase
      .from('mockup_feedback_summary')
      .select('*');

    if (analyticsError) {
      console.error('[API/feedback/mockup] Analytics query error:', analyticsError);
      return NextResponse.json({ error: 'Analytics query failed' }, { status: 500 });
    }

    return NextResponse.json({
      feedback,
      analytics,
      pagination: {
        limit,
        offset,
        total: feedback?.length || 0
      }
    });

  } catch (error) {
    console.error('[API/feedback/mockup] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}