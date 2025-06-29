/**
 * Purpose: Marcus Dashboard Page - Composition-driven dashboard using existing widgets
 * Owner: Dashboard System
 * Tags: [dashboard, composition, marcus, widgets]
 */

'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '../../../components/SupabaseProvider';
import { UniversalSchemaRenderer } from '../../../components/ai/UniversalSchemaRenderer';

interface DashboardComposition {
  id: string;
  name: string;
  context_level: string;
  user_id: string;
  data: any;
  composition: {
    type: string;
    config: any;
    data: {
      items: any[];
    };
  };
}

export default function MarcusDashboard() {
  const [dashboard, setDashboard] = useState<DashboardComposition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useSupabase();

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Please log in to view your dashboard');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/dashboard/${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard');
        }

        const dashboardData = await response.json();
        setDashboard(dashboardData);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Dashboard Found</h2>
          <p className="text-gray-600">Unable to load your dashboard at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {dashboard.data.user.name}!
              </h1>
              <p className="text-gray-600">
                Your leadership development dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  Overall Progress
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {dashboard.data.user.overall_progress_percentage}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

            {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UniversalSchemaRenderer
          schema={{
            ...dashboard.composition,
            id: 'marcus-dashboard-grid',
            version: '1.0.0'
          }}
          userId={dashboard.user_id}
          tenantKey='brilliant'
        />
      </div>

      {/* Quick Actions Footer */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center space-x-4">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Schedule Check-in
            </button>
            <button className="bg-gray-200 text-gray-900 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors">
              View All Videos
            </button>
            <button className="bg-gray-200 text-gray-900 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors">
              My Learning Path
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}