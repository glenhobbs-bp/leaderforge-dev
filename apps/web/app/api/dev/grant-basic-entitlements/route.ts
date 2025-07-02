import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('[DEV] Granting basic entitlements...');

    // Use service role for admin operations
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userId = '47f9db16-f24f-4868-8155-256cfa2edc2c';

    // Step 1: Create the specific entitlements that the navigation system looks for
    const entitlementsToCreate = [
      { name: 'coaching-access', display_name: 'Coaching Access', description: 'Access to coaching features', tenant_key: 'brilliant', features: {"coaching": true} },
      { name: 'library-access', display_name: 'Library Access', description: 'Access to video library', tenant_key: 'brilliant', features: {"library": true} },
      { name: 'community-access', display_name: 'Community Access', description: 'Access to community features', tenant_key: 'brilliant', features: {"community": true} },
    ];

    // Use raw SQL to bypass any remaining RLS issues
    for (const entitlement of entitlementsToCreate) {
      // Create entitlement if it doesn't exist
      const createEntitlementResult = await adminClient.rpc('exec', {
        sql: `
          INSERT INTO core.entitlements (name, display_name, description, tenant_key, features)
          VALUES ('${entitlement.name}', '${entitlement.display_name}', '${entitlement.description}', '${entitlement.tenant_key}', '${JSON.stringify(entitlement.features)}')
          ON CONFLICT (name) DO NOTHING
          RETURNING id;
        `
      });

      console.log(`Entitlement creation result for ${entitlement.name}:`, createEntitlementResult);

      // Get the entitlement ID
      const getIdResult = await adminClient.rpc('exec', {
        sql: `SELECT id FROM core.entitlements WHERE name = '${entitlement.name}';`
      });

      console.log(`Entitlement ID lookup for ${entitlement.name}:`, getIdResult);

      if (getIdResult.data && getIdResult.data.length > 0) {
        const entitlementId = getIdResult.data[0].id;

        // Grant entitlement to user
        const grantResult = await adminClient.rpc('exec', {
          sql: `
            INSERT INTO core.user_entitlements (user_id, entitlement_id, granted_by, grant_reason)
            VALUES ('${userId}', '${entitlementId}', '${userId}', 'Dev grant for testing')
            ON CONFLICT (user_id, entitlement_id) DO NOTHING;
          `
        });

        console.log(`Grant result for ${entitlement.name}:`, grantResult);
      }
    }

    // Clear cache
    await fetch(`${req.nextUrl.origin}/api/entitlements/clear-cache`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    return NextResponse.json({
      success: true,
      message: 'Basic entitlements granted successfully',
      entitlementsCreated: entitlementsToCreate.length,
      userId
    });

  } catch (error) {
    console.error('[DEV] Failed to grant basic entitlements:', error);
    return NextResponse.json({
      error: 'Failed to grant basic entitlements',
      details: (error as Error).message
    }, { status: 500 });
  }
}