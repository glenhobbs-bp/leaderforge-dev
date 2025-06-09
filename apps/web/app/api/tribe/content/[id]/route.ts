/*
// Old proxy route for TribeSocial content - DISABLED (migrated to apps/api)
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const tribeToken = process.env.TRIBE_SOCIAL_TOKEN || '';
  const userAgent = req.headers.get('user-agent') || 'Mozilla/5.0';
  const baseUrl = process.env.TRIBE_SOCIAL_API_URL || 'https://edge.tribesocial.io';

  const { id } = await context.params;
  console.log('[Tribe Proxy] Received id:', id);
  if (!id || isNaN(Number(id))) {
    console.log('[Tribe Proxy] Invalid or missing id:', id);
    return NextResponse.json({ error: 'Missing or invalid collection id' }, { status: 400 });
  }

  const tribeUrl = `${baseUrl}/api/collection-by-id/${id}`;
  console.log('[Tribe Proxy] Fetching:', tribeUrl);

  try {
    const tribeRes = await fetch(tribeUrl, {
      headers: {
        'token': tribeToken,
        'User-Agent': userAgent,
        'Accept': 'application/json',
      },
      method: 'GET',
    });

    const text = await tribeRes.text();
    console.log('[Tribe Proxy] Raw response:', text);
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (e) {
      console.log('[Tribe Proxy] JSON parse error:', e);
      return NextResponse.json({ error: 'TribeSocial did not return JSON', raw: text }, { status: 500 });
    }
  } catch (err) {
    console.log('[Tribe Proxy] Fetch error:', err);
    return NextResponse.json({ error: 'Proxy fetch error', details: String(err) }, { status: 500 });
  }
}
*/