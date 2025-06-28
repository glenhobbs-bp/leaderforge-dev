import { NextResponse } from "next/server";

export async function GET() {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      // Check all Supabase-related environment variables
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      // List all environment variable names that contain 'SUPABASE'
      allSupabaseEnvVars: Object.keys(process.env).filter(key => key.includes('SUPABASE')),
      // Show raw environment variable value (first 10 chars for security)
      SUPABASE_SERVICE_ROLE_KEY_PREVIEW: process.env.SUPABASE_SERVICE_ROLE_KEY 
        ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...'
        : 'NOT_FOUND'
    };

    console.log('[ENV CHECK] Environment variables:', envVars);

    return NextResponse.json({
      message: 'Environment variable check completed',
      environment: envVars,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ENV CHECK] Error:', error);
    return NextResponse.json({
      error: 'Environment check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
