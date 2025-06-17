import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ cookies: req.cookies.getAll() });
}

export async function debugCookiesRoutePendingDelete() {
  return new Response('Debug cookies endpoint (pending delete)', { status: 200 });
}