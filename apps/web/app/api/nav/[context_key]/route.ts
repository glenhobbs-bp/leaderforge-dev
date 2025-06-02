import { getNavOptions } from '../../../lib/navService';

export async function GET(request, { params }) {
  const { context_key } = await params;
  try {
    const navOptions = await getNavOptions(context_key);
    return new Response(JSON.stringify(navOptions), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}