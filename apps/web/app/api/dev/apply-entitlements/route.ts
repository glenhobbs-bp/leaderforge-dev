import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('[DEV] Applying entitlements...');

    // Use service role for admin operations
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Step 0: Create service role policies for entitlements table
    console.log('[DEV] Creating service role policies...');
    try {
      await adminClient.rpc('exec_sql', {
        sql: `
          CREATE POLICY IF NOT EXISTS "service_role_entitlements_all"
          ON core.entitlements
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
        `
      });
      console.log('✅ Service role policies created');
    } catch (policyError) {
      console.warn('⚠️ Policy creation warning (may already exist):', policyError);
    }

    // Step 1: Create entitlements
    const entitlementsToCreate = [
      // ADMIN ENTITLEMENTS
      { name: 'brilliant-admin', display_name: 'Brilliant Admin', description: 'Full administrative access to all Brilliant Movement features and content', context_key: 'brilliant', features: {"allContent": true, "allFeatures": true, "coaching": true, "library": true, "community": true, "gatherings": true, "smallGroups": true, "events": true, "adminPanel": true, "userManagement": true, "analytics": true} },
      { name: 'leaderforge-admin', display_name: 'LeaderForge Admin', description: 'Full administrative access to all LeaderForge business features and content', context_key: 'leaderforge', features: {"allContent": true, "allFeatures": true, "business": true, "businessCoaching": true, "training": true, "teamDashboard": true, "boldActions": true, "analytics": true, "adminPanel": true, "userManagement": true, "executiveSessions": true} },

      // Basic access entitlements
      { name: 'coaching-access', display_name: 'Coaching Access', description: 'Access to coaching features', context_key: 'brilliant', features: {"coaching": true} },
      { name: 'library-access', display_name: 'Library Access', description: 'Access to video library', context_key: 'brilliant', features: {"library": true} },
      { name: 'community-access', display_name: 'Community Access', description: 'Access to community features', context_key: 'brilliant', features: {"community": true} },
      { name: 'business-access', display_name: 'Business Access', description: 'Access to business features', context_key: 'leaderforge', features: {"business": true} },
      { name: 'business-coaching', display_name: 'Business Coaching', description: 'Access to business coaching', context_key: 'leaderforge', features: {"businessCoaching": true} },
      { name: 'training-access', display_name: 'Training Access', description: 'Access to training modules', context_key: 'leaderforge', features: {"training": true} },
    ];

    for (const entitlement of entitlementsToCreate) {
      const { error } = await adminClient
        .schema('core')
        .from('entitlements')
        .upsert({
          name: entitlement.name,
          display_name: entitlement.display_name,
          description: entitlement.description,
          context_key: entitlement.context_key,
          features: entitlement.features
        }, { onConflict: 'name' });

      if (error) {
        console.error(`Failed to create entitlement ${entitlement.name}:`, error);
      } else {
        console.log(`✅ Created/updated entitlement: ${entitlement.name}`);
      }
    }

    // Step 2: Grant entitlements to Glen
    const userId = '47f9db16-f24f-4868-8155-256cfa2edc2c';

    // Get all entitlement IDs
    const { data: entitlements, error: fetchError } = await adminClient
      .schema('core')
      .from('entitlements')
      .select('id, name')
      .in('name', entitlementsToCreate.map(e => e.name));

    if (fetchError) {
      throw new Error(`Failed to fetch entitlements: ${fetchError.message}`);
    }

    // Grant each entitlement
    for (const entitlement of entitlements) {
      const { error } = await adminClient
        .schema('core')
        .from('user_entitlements')
        .upsert({
          user_id: userId,
          entitlement_id: entitlement.id,
          granted_by: userId,
          grant_reason: 'Admin grant - full access for testing'
        }, { onConflict: 'user_id,entitlement_id' });

      if (error) {
        console.error(`Failed to grant entitlement ${entitlement.name}:`, error);
      } else {
        console.log(`✅ Granted entitlement: ${entitlement.name}`);
      }
    }

    // Step 3: Clear entitlement cache
    await fetch(`${req.nextUrl.origin}/api/entitlements/clear-cache`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    return NextResponse.json({
      success: true,
      message: 'Entitlements applied successfully',
      entitlementsCreated: entitlementsToCreate.length,
      userId
    });

  } catch (error) {
    console.error('[DEV] Failed to apply entitlements:', error);
    return NextResponse.json({
      error: 'Failed to apply entitlements',
      details: (error as Error).message
    }, { status: 500 });
  }
}