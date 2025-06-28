import { NextResponse } from "next/server";

export async function GET() {
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL ? 'SET' : 'MISSING',
    VERCEL_ENV: process.env.VERCEL_ENV || 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    timestamp: new Date().toISOString()
  };

  console.log('[ENV SIMPLE] Environment check:', envCheck);

  return NextResponse.json(envCheck);
}