import { getContextConfig } from '../../../lib/contextService';

export async function GET(request, { params }) {
  const { context_key } = await params;
  try {
    const config = await getContextConfig(context_key);
    if (!config) {
      return new Response(JSON.stringify({ error: 'Context config not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}