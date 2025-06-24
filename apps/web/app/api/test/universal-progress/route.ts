/**
 * Universal Progress Tool Integration Test API
 * Purpose: Test end-to-end functionality with real database
 * Owner: Senior Engineering Team
 * Tags: testing, integration, api-endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserProgressService } from '../../../lib/userProgressService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, contentId, contextKey, progressData } = body;

    switch (action) {
      case 'getProgress': {
        const progress = await UserProgressService.getProgress(userId, contentId, contextKey);
        return NextResponse.json({ success: true, data: progress });
      }

      case 'setProgress': {
        const updatedProgress = await UserProgressService.updateProgress(userId, contentId, contextKey, progressData);
        return NextResponse.json({ success: true, data: updatedProgress });
      }

      case 'listProgress': {
        const contentIds = body.contentIds || [];
        const progressList = await UserProgressService.getProgressForContentIds(userId, contentIds, contextKey);
        return NextResponse.json({ success: true, data: progressList });
      }

      case 'getProgressSummary': {
        const summary = await UserProgressService.getProgressSummary(userId, contextKey);
        return NextResponse.json({ success: true, data: summary });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Universal Progress Test API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  // Simple health check that shows available test types
  return NextResponse.json({
    message: 'Universal Progress Tool Integration Test API',
    availableTests: [
      'video',
      'quiz',
      'reading',
      'getProgress',
      'getProgressSummary',
      'getCompletionStats',
      'checkMilestones',
      'batchTest'
    ],
    usage: 'POST with { "testType": "video", "userId": "optional", "contextKey": "optional", "contentId": "optional" }',
    note: 'This endpoint tests real database integration - ensure the core.user_progress table exists'
  });
}