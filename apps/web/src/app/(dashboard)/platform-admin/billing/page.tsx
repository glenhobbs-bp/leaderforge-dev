/**
 * File: src/app/(dashboard)/platform-admin/billing/page.tsx
 * Purpose: Platform Admin - Tenant billing and subscription view (placeholder)
 * Owner: LeaderForge Team
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { 
  CreditCard, Building2, DollarSign, Calendar, 
  TrendingUp, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function PlatformBillingPage() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Check if user is platform admin
  const { data: userData } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_platform_admin) {
    redirect('/dashboard');
  }

  // Fetch tenants for billing display
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, tenant_key, display_name, is_active, created_at')
    .order('display_name');

  // Get user counts per tenant for "seats"
  const tenantsWithBilling = await Promise.all(
    (tenants || []).map(async (tenant) => {
      const { count: userCount } = await supabase
        .from('memberships')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('is_active', true);

      return {
        ...tenant,
        userCount: userCount || 0,
        // Placeholder billing data
        plan: tenant.tenant_key === 'leaderforge' ? 'Platform' : 'Enterprise',
        status: tenant.is_active ? 'active' : 'suspended',
        mrr: tenant.tenant_key === 'leaderforge' ? 0 : (userCount || 0) * 25, // $25/user placeholder
        nextBilling: tenant.tenant_key === 'leaderforge' ? null : '2025-01-15',
      };
    })
  );

  // Calculate totals
  const totalMRR = tenantsWithBilling.reduce((sum, t) => sum + t.mrr, 0);
  const activeSubscriptions = tenantsWithBilling.filter(t => t.status === 'active' && t.mrr > 0).length;
  const totalSeats = tenantsWithBilling.reduce((sum, t) => sum + t.userCount, 0);

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          Billing & Subscriptions
        </h1>
        <p className="text-muted-foreground mt-1">
          View tenant subscription status and revenue
        </p>
      </div>

      {/* Placeholder Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Placeholder Data</p>
              <p className="text-sm text-amber-700">
                This is a preview of the billing dashboard. Actual billing integration with 
                Stripe or another payment provider will be implemented in a future phase.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalMRR.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Monthly Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSubscriptions}</p>
                <p className="text-xs text-muted-foreground">Active Subscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSeats}</p>
                <p className="text-xs text-muted-foreground">Total Seats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">$25</p>
                <p className="text-xs text-muted-foreground">Per Seat / Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Subscriptions</CardTitle>
          <CardDescription>
            Subscription status and billing for each tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {tenantsWithBilling.map((tenant) => (
              <div 
                key={tenant.id} 
                className="flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{tenant.display_name}</h4>
                      <Badge 
                        variant={tenant.status === 'active' ? 'default' : 'destructive'}
                        className={tenant.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                      >
                        {tenant.status === 'active' ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                          'Suspended'
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tenant.plan} Plan • {tenant.userCount} seats
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="font-semibold">
                      {tenant.mrr > 0 ? `$${tenant.mrr.toLocaleString()}/mo` : '—'}
                    </p>
                    {tenant.nextBilling && (
                      <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />
                        Next: {tenant.nextBilling}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Future Features */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            Future Billing Features
          </CardTitle>
          <CardDescription>
            Coming with payment provider integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>Stripe integration for payments</li>
              <li>Invoice generation and history</li>
              <li>Subscription plan management</li>
              <li>Usage-based billing options</li>
            </ul>
            <ul className="list-disc list-inside space-y-1">
              <li>Payment method management</li>
              <li>Billing alerts and notifications</li>
              <li>Revenue analytics and forecasting</li>
              <li>Discount and promotion codes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
