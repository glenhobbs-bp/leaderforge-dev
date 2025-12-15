/**
 * File: src/app/api/reflection-prompts/route.ts
 * Purpose: Generate AI-powered context-aware reflection prompts for bold action completion
 * Owner: LeaderForge Team
 * 
 * Part of 7.5 AI-Enhanced Reflection Prompts feature.
 * Generates personalized questions based on:
 * - The bold action text
 * - Completion status (fully/partially/blocked)
 * - Content module context
 * - User's history with bold actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ReflectionContext {
  user: {
    fullName: string;
  };
  boldAction: {
    text: string;
    contentId: string;
  };
  completionStatus: 'fully' | 'partially' | 'blocked';
  moduleTitle: string;
  history: {
    totalBoldActions: number;
    completedBoldActions: number;
    averageChallengeLevel: number | null;
    recentReflections: Array<{
      moduleTitle: string;
      completionStatus: string;
      reflectionText: string | null;
    }>;
  };
}

interface ReflectionPromptsResponse {
  primaryPrompt: string;
  followUpPrompts: string[];
  encouragement: string;
  generatedAt: string;
}

// Fallback prompts when AI is unavailable
const FALLBACK_PROMPTS: Record<string, ReflectionPromptsResponse> = {
  fully: {
    primaryPrompt: "What did you learn about yourself while completing this bold action?",
    followUpPrompts: [
      "What was the most surprising or unexpected part of this experience?",
      "How might you apply what you learned to other areas of your work or life?",
      "What would you do differently if you could do it again?",
    ],
    encouragement: "Great job completing your bold action! Taking time to reflect helps solidify your learning.",
    generatedAt: new Date().toISOString(),
  },
  partially: {
    primaryPrompt: "What progress did you make, and what held you back from full completion?",
    followUpPrompts: [
      "What would need to change for you to complete this fully next time?",
      "What did you learn from the parts you did complete?",
      "Is there support or resources that would help you move forward?",
    ],
    encouragement: "Partial progress is still progress! Reflecting on barriers helps you overcome them next time.",
    generatedAt: new Date().toISOString(),
  },
  blocked: {
    primaryPrompt: "What obstacles prevented you from taking action on this commitment?",
    followUpPrompts: [
      "Were these obstacles within your control, or external factors?",
      "What would need to be different for this to be achievable?",
      "Is there a smaller version of this action that might be more realistic?",
    ],
    encouragement: "It's valuable to understand what blocks us. This reflection will help you set more achievable goals.",
    generatedAt: new Date().toISOString(),
  },
};

/**
 * POST /api/reflection-prompts
 * Generate AI-powered reflection prompts
 * 
 * Body: {
 *   contentId: string,
 *   boldActionText: string,
 *   completionStatus: 'fully' | 'partially' | 'blocked'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contentId, boldActionText, completionStatus } = body;

    if (!contentId || !boldActionText || !completionStatus) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: contentId, boldActionText, completionStatus' },
        { status: 400 }
      );
    }

    if (!['fully', 'partially', 'blocked'].includes(completionStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid completionStatus. Must be: fully, partially, or blocked' },
        { status: 400 }
      );
    }

    // Check if AI is available
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      // Return fallback prompts when AI is not configured
      console.log('[Reflection Prompts] ANTHROPIC_API_KEY not configured, using fallback prompts');
      return NextResponse.json({
        success: true,
        data: {
          ...FALLBACK_PROMPTS[completionStatus],
          generatedAt: new Date().toISOString(),
          isAIGenerated: false,
        },
      });
    }

    // Gather context for AI generation
    const context = await gatherReflectionContext(
      supabase,
      user.id,
      contentId,
      boldActionText,
      completionStatus
    );

    if (!context) {
      // Fallback if context gathering fails
      return NextResponse.json({
        success: true,
        data: {
          ...FALLBACK_PROMPTS[completionStatus],
          generatedAt: new Date().toISOString(),
          isAIGenerated: false,
        },
      });
    }

    // Generate AI prompts
    const prompts = await generateAIReflectionPrompts(context, apiKey);

    return NextResponse.json({
      success: true,
      data: {
        ...prompts,
        isAIGenerated: true,
      },
    });

  } catch (error) {
    console.error('[Reflection Prompts] Error:', error);
    
    // Return fallback on any error
    return NextResponse.json({
      success: true,
      data: {
        ...FALLBACK_PROMPTS.fully,
        generatedAt: new Date().toISOString(),
        isAIGenerated: false,
      },
    });
  }
}

/**
 * Gather context for AI prompt generation
 */
async function gatherReflectionContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  contentId: string,
  boldActionText: string,
  completionStatus: 'fully' | 'partially' | 'blocked'
): Promise<ReflectionContext | null> {
  try {
    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();

    // Get bold action history for this user
    const { data: boldActions } = await supabase
      .from('bold_actions')
      .select('id, action_description, status, challenge_level, completion_status, reflection_text, content_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const completedBoldActions = boldActions?.filter(ba => ba.status === 'completed')?.length || 0;
    const totalBoldActions = boldActions?.length || 0;

    // Calculate average challenge level from completed actions
    const challengeLevels = boldActions
      ?.filter(ba => ba.challenge_level !== null)
      ?.map(ba => ba.challenge_level as number) || [];
    const averageChallengeLevel = challengeLevels.length > 0
      ? challengeLevels.reduce((a, b) => a + b, 0) / challengeLevels.length
      : null;

    // Get recent reflections with module titles (simplified - using content_id)
    const recentReflections = boldActions
      ?.filter(ba => ba.reflection_text || ba.completion_status)
      ?.slice(0, 3)
      ?.map(ba => ({
        moduleTitle: `Module ${ba.content_id?.slice(0, 8) || 'Unknown'}`,
        completionStatus: ba.completion_status || ba.status,
        reflectionText: ba.reflection_text,
      })) || [];

    return {
      user: {
        fullName: userData?.full_name || 'Learner',
      },
      boldAction: {
        text: boldActionText,
        contentId,
      },
      completionStatus,
      moduleTitle: `Learning Module`, // Could be enhanced with actual module title
      history: {
        totalBoldActions,
        completedBoldActions,
        averageChallengeLevel,
        recentReflections,
      },
    };
  } catch (error) {
    console.error('[Reflection Prompts] Error gathering context:', error);
    return null;
  }
}

/**
 * Generate AI reflection prompts using Claude
 */
async function generateAIReflectionPrompts(
  context: ReflectionContext,
  apiKey: string
): Promise<ReflectionPromptsResponse> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey });

  const prompt = buildReflectionPrompt(context);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' 
    ? message.content[0].text 
    : '';

  return parseAIResponse(responseText, context.completionStatus);
}

/**
 * Build the prompt for Claude
 */
function buildReflectionPrompt(context: ReflectionContext): string {
  const completionRate = context.history.totalBoldActions > 0
    ? Math.round((context.history.completedBoldActions / context.history.totalBoldActions) * 100)
    : 0;

  const statusContext = {
    fully: "The learner FULLY COMPLETED their bold action. Focus on celebrating success and deepening learning.",
    partially: "The learner PARTIALLY COMPLETED their bold action. Focus on acknowledging progress while gently exploring barriers.",
    blocked: "The learner was BLOCKED and unable to complete their bold action. Focus on understanding obstacles without judgment.",
  };

  return `You are an expert leadership coach helping a learner reflect on their bold action commitment. Generate thoughtful, context-aware reflection questions.

## CONTEXT

**Learner:** ${context.user.fullName}
**Bold Action:** "${context.boldAction.text}"
**Completion Status:** ${context.completionStatus.toUpperCase()}

${statusContext[context.completionStatus]}

**History:**
- Bold Actions Completed: ${context.history.completedBoldActions}/${context.history.totalBoldActions} (${completionRate}%)
- Average Challenge Level: ${context.history.averageChallengeLevel ? context.history.averageChallengeLevel.toFixed(1) + '/4' : 'N/A'}

${context.history.recentReflections.length > 0 ? `**Recent Reflections:**
${context.history.recentReflections.map(r => 
  `- ${r.moduleTitle}: ${r.completionStatus}${r.reflectionText ? ` - "${r.reflectionText.slice(0, 100)}..."` : ''}`
).join('\n')}` : ''}

## YOUR TASK

Generate a JSON response with EXACTLY this structure:
{
  "primaryPrompt": "The main reflection question (1 sentence, directly related to their specific bold action)",
  "followUpPrompts": ["3 follow-up questions that deepen reflection", "Be specific to their action", "Avoid generic questions"],
  "encouragement": "A brief, warm message acknowledging their effort (1-2 sentences)"
}

REQUIREMENTS:
1. Questions should be specific to their bold action "${context.boldAction.text}"
2. Tone should match completion status (celebratory for full, supportive for partial, compassionate for blocked)
3. Questions should be open-ended, not yes/no
4. Keep everything concise - this is a quick reflection, not therapy
5. Return ONLY valid JSON, no markdown or explanation

JSON Response:`;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(
  responseText: string,
  completionStatus: 'fully' | 'partially' | 'blocked'
): ReflectionPromptsResponse {
  try {
    // Clean up the response - remove any markdown formatting
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.slice(7);
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    const parsed = JSON.parse(cleanedResponse);

    return {
      primaryPrompt: parsed.primaryPrompt || FALLBACK_PROMPTS[completionStatus].primaryPrompt,
      followUpPrompts: Array.isArray(parsed.followUpPrompts) && parsed.followUpPrompts.length > 0
        ? parsed.followUpPrompts.slice(0, 3)
        : FALLBACK_PROMPTS[completionStatus].followUpPrompts,
      encouragement: parsed.encouragement || FALLBACK_PROMPTS[completionStatus].encouragement,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Reflection Prompts] Error parsing AI response:', error);
    return {
      ...FALLBACK_PROMPTS[completionStatus],
      generatedAt: new Date().toISOString(),
    };
  }
}
