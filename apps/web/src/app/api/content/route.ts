/**
 * File: src/app/api/content/route.ts
 * Purpose: API route for fetching content library
 * Owner: Core Team
 */

import { NextResponse } from 'next/server';
import { fetchContentCollection, LEADERFORGE_COLLECTION_ID } from '@/lib/tribe-social';

export async function GET() {
  try {
    const content = await fetchContentCollection(LEADERFORGE_COLLECTION_ID);
    
    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('Content API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

