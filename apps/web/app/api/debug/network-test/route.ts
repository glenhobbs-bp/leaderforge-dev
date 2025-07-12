// Network diagnostic endpoint
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    message: 'Network test successful'
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    message: 'POST network test successful'
  });
}