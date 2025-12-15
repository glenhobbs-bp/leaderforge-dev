/**
 * File: src/app/api/health/route.ts
 * Purpose: Simple health check endpoint for debugging
 * Owner: Core Team
 */

import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[Health] Health check hit');
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
}

