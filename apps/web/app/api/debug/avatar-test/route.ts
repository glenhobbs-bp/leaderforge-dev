/**
 * Debug endpoint to test avatar URL accessibility
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testUrl = searchParams.get('url') || '/icons/default-avatar.svg';

  try {
    // Test if the URL is accessible
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${testUrl}`);

    return NextResponse.json({
      success: true,
      url: testUrl,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      accessible: response.ok
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      url: testUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
      accessible: false
    });
  }
}