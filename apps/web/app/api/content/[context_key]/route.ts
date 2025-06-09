import { NextRequest } from 'next/server';
import { getContentForContext } from '../../../lib/contentService';

export async function GET(req: NextRequest, context: { params: { context_key: string } }) {
  try {
    const content = await getContentForContext(context.params.context_key);
    return new Response(JSON.stringify(content), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}