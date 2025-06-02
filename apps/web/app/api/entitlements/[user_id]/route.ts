import { NextRequest } from 'next/server';
import { getUserEntitlements } from '../../../lib/entitlementService';

export async function GET(req: NextRequest, { params }: { params: { user_id: string } }) {
  try {
    const entitlements = await getUserEntitlements(params.user_id);
    return new Response(JSON.stringify(entitlements), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}