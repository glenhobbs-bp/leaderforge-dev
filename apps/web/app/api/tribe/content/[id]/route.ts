import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Missing collection id' }, { status: 400 });
  }

  const TRIBE_SOCIAL_API_URL = process.env.TRIBE_SOCIAL_API_URL || 'https://edge.tribesocial.io';
  const TRIBE_SOCIAL_TOKEN = process.env.TRIBE_SOCIAL_TOKEN;

  if (!TRIBE_SOCIAL_TOKEN) {
    return NextResponse.json({ error: 'TribeSocial token not configured' }, { status: 500 });
  }

  const url = `${TRIBE_SOCIAL_API_URL}/api/collection-by-id/${id}`;

  try {
    const tribeRes = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Cookie': `token=${TRIBE_SOCIAL_TOKEN}`,
        'User-Agent': 'LeaderForge-API-Proxy/1.0',
      },
    });

    const text = await tribeRes.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: 'TribeSocial did not return JSON', raw: text },
        { status: 502 }
      );
    }

    if (!tribeRes.ok) {
      return NextResponse.json(
        { error: data?.error || tribeRes.statusText, details: data },
        { status: tribeRes.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch from TribeSocial', details: errorMessage },
      { status: 500 }
    );
  }
}