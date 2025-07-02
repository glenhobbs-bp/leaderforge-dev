import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('[DEV] Creating simple entitlements...');

    // Use service role for admin operations
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userId = '47f9db16-f24f-4868-8155-256cfa2edc2c';

    // Create entitlements and grant them in one step
    const { data, error } = await adminClient.rpc('exec_sql', {
      sql: `
        -- Create basic entitlements
        INSERT INTO core.entitlements (name, display_name, description, tenant_key, features)
        VALUES
          ('coaching-access', 'Coaching Access', 'Access to coaching features', 'brilliant', '{"coaching": true}'),
          ('library-access', 'Library Access', 'Access to video library', 'brilliant', '{"library": true}'),
          ('community-access', 'Community Access', 'Access to community features', 'brilliant', '{"community": true}')
        ON CONFLICT (name) DO NOTHING;

        -- Grant all these entitlements to Glen
        INSERT INTO core.user_entitlements (user_id, entitlement_id, granted_by, grant_reason)
        SELECT
          '${userId}'::uuid,
          e.id,
          '${userId}'::uuid,
          'Dev grant for navigation testing'
        FROM core.entitlements e
        WHERE e.name IN ('coaching-access', 'library-access', 'community-access')
        ON CONFLICT (user_id, entitlement_id) DO NOTHING;

        -- Return the count of entitlements granted
        SELECT COUNT(*) as granted_count
        FROM core.user_entitlements ue
        JOIN core.entitlements e ON e.id = ue.entitlement_id
        WHERE ue.user_id = '${userId}'::uuid
        AND e.name IN ('coaching-access', 'library-access', 'community-access');
      `
    });

    if (error) {
      throw error;
    }

    console.log('[DEV] SQL execution result:', data);

    // Clear cache
    await fetch(`${req.nextUrl.origin}/api/entitlements/clear-cache`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    return NextResponse.json({
      success: true,
      message: 'Simple entitlements created successfully',
      data,
      userId
    });

  } catch (error) {
    console.error('[DEV] Failed to create simple entitlements:', error);
    return NextResponse.json({
      error: 'Failed to create simple entitlements',
      details: (error as Error).message
    }, { status: 500 });
  }
}