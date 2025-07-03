/**
 * File: apps/web/app/api/agent/admin/route.ts
 * Purpose: Admin agent endpoint for CopilotKit integration
 * Owner: Engineering Team
 * Tags: #api #admin #copilotkit #agent-native
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../lib/supabaseServerClient';
import { AdminAgent } from 'agent-core/agents/AdminAgent';
import type { AdminAgentContext } from 'agent-core/agents/AdminAgent';

/**
 * POST /api/agent/admin
 * Thin endpoint that validates admin access and proxies to AdminAgent
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate session & admin status (SSR)
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin, tenant_key')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { intent, currentStep, state, formData } = body;

    // 3. Create agent context
    const context: AdminAgentContext = {
      userId: session.user.id,
      tenantKey: profile.tenant_key,
      isAdmin: true,
      intent: intent || '',
      currentStep,
      state: state || formData || {}
    };

    // 4. Invoke AdminAgent
    const adminAgent = new AdminAgent();
    const response = await adminAgent.processIntent(context);

    // 5. Return agent response untouched
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API/agent/admin] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}