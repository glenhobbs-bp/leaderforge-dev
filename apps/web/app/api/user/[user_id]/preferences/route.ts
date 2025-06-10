import { NextRequest } from 'next/server';
import { userService } from '../../../../lib/userService';

/**
 * GET /api/user/[user_id]/preferences
 * Returns user preferences (localization, avatar, etc.).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const { user_id } = params;
  console.log(`[API] GET /api/user/${user_id}/preferences`);
  if (!user_id || typeof user_id !== 'string') {
    console.error('[API] Missing or invalid user_id');
    return new Response(JSON.stringify({ error: 'Missing or invalid user_id' }), { status: 400 });
  }
  try {
    const user = await userService.getUser(user_id);
    if (!user) {
      console.error(`[API] User not found: ${user_id}`);
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }
    console.log(`[API] Found preferences for user: ${user_id}`);
    return new Response(JSON.stringify(user.preferences || {}), { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching user preferences:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}

/**
 * PATCH /api/user/[user_id]/preferences
 * Updates user preferences (partial update).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const { user_id } = params;
  console.log(`[API] PATCH /api/user/${user_id}/preferences`);
  if (!user_id || typeof user_id !== 'string') {
    console.error('[API] Missing or invalid user_id');
    return new Response(JSON.stringify({ error: 'Missing or invalid user_id' }), { status: 400 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    console.error('[API] Invalid JSON body');
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    console.error('[API] Missing or invalid preferences in body');
    return new Response(JSON.stringify({ error: 'Missing or invalid preferences' }), { status: 400 });
  }
  try {
    const updated = await userService.updateUserPreferences(user_id, body);
    if (!updated) {
      console.error(`[API] User not found for update: ${user_id}`);
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }
    console.log(`[API] Updated preferences for user: ${user_id}`);
    return new Response(JSON.stringify(updated.preferences || {}), { status: 200 });
  } catch (error: any) {
    console.error('[API] Error updating user preferences:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.