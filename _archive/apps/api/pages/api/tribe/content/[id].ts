import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Missing or invalid collection id' });
  }

  const TRIBE_SOCIAL_API_URL = process.env.TRIBE_SOCIAL_API_URL || 'https://edge.tribesocial.io';
  const TRIBE_SOCIAL_TOKEN = process.env.TRIBE_SOCIAL_TOKEN;
  if (!TRIBE_SOCIAL_TOKEN) {
    return res.status(500).json({ error: 'TribeSocial token not configured' });
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
    } catch (e) {
      return res.status(502).json({ error: 'TribeSocial did not return JSON', raw: text });
    }
    if (!tribeRes.ok) {
      return res.status(tribeRes.status).json({ error: data?.error || tribeRes.statusText, details: data });
    }
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch from TribeSocial', details: err.message });
  }
}