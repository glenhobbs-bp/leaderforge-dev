/**
 * File: apps/web/src/app/api/checkins/[id]/cheat-sheet/route.ts
 * Purpose: Generate AI-powered check-in cheat sheet for team leaders
 * Owner: LeaderForge Team
 * 
 * This is the first AI feature in LeaderForge MVP.
 * Provides team leaders with AI-generated insights before 5-minute check-ins.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface CheatSheetContext {
  user: {
    fullName: string;
    email: string;
  };
  currentModule: {
    id: string;
    title: string;
  };
  progressSnapshot: {
    overallModulesCompleted: number;
    totalModules: number;
    currentStreak: number;
    lastActivityDate: string | null;
  };
  currentBoldAction: {
    text: string;
    status: string;
  } | null;
  worksheetResponse: {
    keyTakeaways: string;
    boldAction: string;
    questions: string;
  } | null;
  history: {
    boldActionsCompleted: number;
    boldActionsTotal: number;
    averageChallengeLevel: number | null;
    reflections: Array<{
      moduleTitle: string;
      completionStatus: string;
      challengeLevel: number | null;
      wouldRepeat: string | null;
      reflectionText: string | null;
    }>;
  };
}

interface CheatSheetResponse {
  progressSnapshot: string;
  boldActionReview: string;
  stretchAnalysis: string;
  completionHistory: string;
  activationTips: string[];
  generatedAt: string;
}

/**
 * GET /api/checkins/[id]/cheat-sheet
 * Generate AI-powered cheat sheet for a pending check-in
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: checkinId } = await params;
    const supabase = await createClient();
    
    // Verify the current user is authenticated and is the leader for this check-in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch the check-in request
    const { data: checkin, error: checkinError } = await supabase
      .from('checkin_requests')
      .select('*')
      .eq('id', checkinId)
      .single();

    if (checkinError || !checkin) {
      return NextResponse.json(
        { success: false, error: 'Check-in not found' },
        { status: 404 }
      );
    }

    // Verify the current user is the leader for this check-in
    if (checkin.leader_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You are not the leader for this check-in' },
        { status: 403 }
      );
    }

    // Gather all context data for the AI
    const context = await gatherCheatSheetContext(supabase, checkin);
    
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Failed to gather user context' },
        { status: 500 }
      );
    }

    // Check if we have an API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Return a mock response for development/testing
      return NextResponse.json({
        success: true,
        data: generateMockCheatSheet(context),
      });
    }

    // Generate the AI cheat sheet
    const cheatSheet = await generateAICheatSheet(context, apiKey);

    return NextResponse.json({
      success: true,
      data: cheatSheet,
    });
  } catch (error) {
    console.error('Cheat sheet generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate cheat sheet' },
      { status: 500 }
    );
  }
}

/**
 * Gather all relevant context for the AI cheat sheet
 */
async function gatherCheatSheetContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  checkin: { user_id: string; content_id: string }
): Promise<CheatSheetContext | null> {
  try {
    // 1. Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', checkin.user_id)
      .single();

    if (!userData) return null;

    // 2. Get all content items (modules) - for now we'll use the content_id as title
    // In a real implementation, this would fetch from Tribe Social
    const currentModuleTitle = `Module ${checkin.content_id}`;

    // 3. Get all user progress
    const { data: allProgress } = await supabase
      .from('user_progress')
      .select('content_id, progress_percentage, completed_at')
      .eq('user_id', checkin.user_id);

    // 4. Get user streak
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('current_streak, last_activity_date')
      .eq('user_id', checkin.user_id)
      .single();

    // 5. Get current bold action for this module
    const { data: currentBoldAction } = await supabase
      .from('bold_actions')
      .select('action_description, status')
      .eq('user_id', checkin.user_id)
      .eq('content_id', checkin.content_id)
      .single();

    // 6. Get worksheet response for current module
    const { data: worksheetData } = await supabase
      .from('worksheet_submissions')
      .select('responses')
      .eq('user_id', checkin.user_id)
      .eq('content_id', checkin.content_id)
      .single();

    // 7. Get all bold actions for history
    const { data: allBoldActions } = await supabase
      .from('bold_actions')
      .select('content_id, action_description, status, completion_status, challenge_level, would_repeat, reflection_text')
      .eq('user_id', checkin.user_id);

    // Calculate metrics
    const completedModules = allProgress?.filter(p => p.progress_percentage >= 90).length || 0;
    const totalModules = 20; // Hardcoded for now, should come from content service
    
    const completedBoldActions = allBoldActions?.filter(
      ba => ba.status === 'completed'
    ).length || 0;

    const challengeLevels = allBoldActions
      ?.filter(ba => ba.challenge_level)
      .map(ba => ba.challenge_level as number) || [];
    
    const avgChallengeLevel = challengeLevels.length > 0
      ? challengeLevels.reduce((a, b) => a + b, 0) / challengeLevels.length
      : null;

    // Build reflections history
    const reflections = allBoldActions
      ?.filter(ba => ba.completion_status || ba.reflection_text)
      .map(ba => ({
        moduleTitle: `Module ${ba.content_id}`,
        completionStatus: ba.completion_status || 'unknown',
        challengeLevel: ba.challenge_level,
        wouldRepeat: ba.would_repeat,
        reflectionText: ba.reflection_text,
      })) || [];

    // Parse worksheet responses
    const worksheetResponses = worksheetData?.responses as {
      keyTakeaways?: string;
      boldAction?: string;
      questions?: string;
    } | null;

    return {
      user: {
        fullName: userData.full_name || 'Team Member',
        email: userData.email,
      },
      currentModule: {
        id: checkin.content_id,
        title: currentModuleTitle,
      },
      progressSnapshot: {
        overallModulesCompleted: completedModules,
        totalModules,
        currentStreak: streakData?.current_streak || 0,
        lastActivityDate: streakData?.last_activity_date || null,
      },
      currentBoldAction: currentBoldAction ? {
        text: currentBoldAction.action_description,
        status: currentBoldAction.status,
      } : null,
      worksheetResponse: worksheetResponses ? {
        keyTakeaways: worksheetResponses.keyTakeaways || '',
        boldAction: worksheetResponses.boldAction || '',
        questions: worksheetResponses.questions || '',
      } : null,
      history: {
        boldActionsCompleted: completedBoldActions,
        boldActionsTotal: allBoldActions?.length || 0,
        averageChallengeLevel: avgChallengeLevel,
        reflections: reflections.slice(-5), // Last 5 reflections
      },
    };
  } catch (error) {
    console.error('Error gathering context:', error);
    return null;
  }
}

/**
 * Generate AI cheat sheet using Claude
 */
async function generateAICheatSheet(
  context: CheatSheetContext,
  apiKey: string
): Promise<CheatSheetResponse> {
  const anthropic = new Anthropic({ apiKey });

  const prompt = buildCheatSheetPrompt(context);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Parse the response
  const responseText = message.content[0].type === 'text' 
    ? message.content[0].text 
    : '';

  return parseAIResponse(responseText, context);
}

/**
 * Build the prompt for Claude
 */
function buildCheatSheetPrompt(context: CheatSheetContext): string {
  const completionRate = context.history.boldActionsTotal > 0
    ? Math.round((context.history.boldActionsCompleted / context.history.boldActionsTotal) * 100)
    : 0;

  return `You are an expert leadership coach helping a team leader prepare for a 5-minute check-in meeting with their team member. Generate a concise, actionable "cheat sheet" that will help the leader have a productive and supportive conversation.

## TEAM MEMBER CONTEXT

**Name:** ${context.user.fullName}
**Current Module:** ${context.currentModule.title}

**Progress Snapshot:**
- Modules Completed: ${context.progressSnapshot.overallModulesCompleted}/${context.progressSnapshot.totalModules}
- Current Streak: ${context.progressSnapshot.currentStreak} days
- Last Activity: ${context.progressSnapshot.lastActivityDate || 'Unknown'}

**Current Bold Action:**
${context.currentBoldAction ? `"${context.currentBoldAction.text}" (Status: ${context.currentBoldAction.status})` : 'No bold action set yet'}

**Worksheet Response:**
${context.worksheetResponse ? `
- Key Takeaways: "${context.worksheetResponse.keyTakeaways}"
- Bold Action: "${context.worksheetResponse.boldAction}"
- Questions: "${context.worksheetResponse.questions || 'None'}"
` : 'No worksheet submitted yet'}

**History:**
- Bold Actions Completed: ${context.history.boldActionsCompleted}/${context.history.boldActionsTotal} (${completionRate}%)
- Average Challenge Level: ${context.history.averageChallengeLevel ? context.history.averageChallengeLevel.toFixed(1) + '/4' : 'N/A'}

**Recent Reflections:**
${context.history.reflections.length > 0 
  ? context.history.reflections.map(r => 
      `- ${r.moduleTitle}: ${r.completionStatus}${r.challengeLevel ? `, Challenge: ${r.challengeLevel}/4` : ''}${r.wouldRepeat ? `, Would Repeat: ${r.wouldRepeat}` : ''}${r.reflectionText ? `\n  Reflection: "${r.reflectionText}"` : ''}`
    ).join('\n')
  : 'No reflections yet'}

## YOUR TASK

Generate a JSON response with EXACTLY this structure:
{
  "progressSnapshot": "A 1-2 sentence summary of where this person is in their learning journey",
  "boldActionReview": "A 1-2 sentence analysis of their current bold action - is it specific enough? Appropriately challenging?",
  "stretchAnalysis": "A 1-2 sentence assessment: Is this person being appropriately stretched? Under-challenged? Over-challenged?",
  "completionHistory": "A 1-2 sentence pattern analysis based on their history",
  "activationTips": ["Tip 1 - a specific conversation starter", "Tip 2 - a coaching question to ask", "Tip 3 - a way to encourage or challenge them"]
}

IMPORTANT:
- Be supportive, not judgmental
- Focus on growth and encouragement
- Make tips specific to THIS person's situation
- Keep it concise - this is a 5-minute meeting
- Return ONLY valid JSON, no other text`;
}

/**
 * Parse the AI response into structured format
 */
function parseAIResponse(
  responseText: string,
  context: CheatSheetContext
): CheatSheetResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        progressSnapshot: parsed.progressSnapshot || '',
        boldActionReview: parsed.boldActionReview || '',
        stretchAnalysis: parsed.stretchAnalysis || '',
        completionHistory: parsed.completionHistory || '',
        activationTips: Array.isArray(parsed.activationTips) ? parsed.activationTips : [],
        generatedAt: new Date().toISOString(),
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }

  // Fallback to mock if parsing fails
  return generateMockCheatSheet(context);
}

/**
 * Generate a mock cheat sheet for development/testing
 */
function generateMockCheatSheet(context: CheatSheetContext): CheatSheetResponse {
  const completionRate = context.history.boldActionsTotal > 0
    ? Math.round((context.history.boldActionsCompleted / context.history.boldActionsTotal) * 100)
    : 0;

  return {
    progressSnapshot: `${context.user.fullName} has completed ${context.progressSnapshot.overallModulesCompleted} of ${context.progressSnapshot.totalModules} modules (${Math.round((context.progressSnapshot.overallModulesCompleted / context.progressSnapshot.totalModules) * 100)}%). ${context.progressSnapshot.currentStreak > 0 ? `Currently on a ${context.progressSnapshot.currentStreak}-day streak!` : 'No active streak.'}`,
    
    boldActionReview: context.currentBoldAction 
      ? `Their bold action "${context.currentBoldAction.text}" is ${context.currentBoldAction.status}. ${context.currentBoldAction.status === 'pending' ? 'Check if they need support getting started.' : 'Celebrate their progress!'}`
      : 'No bold action set yet. Help them commit to a specific action.',
    
    stretchAnalysis: context.history.averageChallengeLevel 
      ? `Average challenge level is ${context.history.averageChallengeLevel.toFixed(1)}/4. ${context.history.averageChallengeLevel < 2 ? 'Consider encouraging more ambitious goals.' : context.history.averageChallengeLevel > 3 ? 'May be over-stretched - check for burnout.' : 'Appropriately challenged!'}`
      : 'Not enough data yet to assess stretch level.',
    
    completionHistory: `${completionRate}% bold action completion rate. ${completionRate >= 80 ? 'Strong follow-through!' : completionRate >= 50 ? 'Moderate follow-through - explore any blockers.' : 'Low follow-through - discuss what\'s getting in the way.'}`,
    
    activationTips: [
      context.worksheetResponse?.questions 
        ? `Address their question: "${context.worksheetResponse.questions}"`
        : `Ask: "What's the one thing that would make the biggest difference from this module?"`,
      `Ask: "On a scale of 1-10, how confident are you about completing your bold action?"`,
      context.progressSnapshot.currentStreak > 3
        ? `Celebrate their ${context.progressSnapshot.currentStreak}-day streak and encourage them to keep it going!`
        : `Encourage them to build momentum with small daily wins.`,
    ],
    
    generatedAt: new Date().toISOString(),
  };
}

