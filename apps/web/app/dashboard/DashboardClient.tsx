"use client";
import { lazy, Suspense } from 'react';
import SupabaseProvider from '../../components/SupabaseProvider';
import { Session } from '@supabase/supabase-js';

// Type definitions
interface Context {
  context_key: string;
  display_name: string;
  theme: Record<string, string>;
  i18n: Record<string, string>;
  logo_url: string;
  nav_options: unknown;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  subtitle: string | null;
}

interface NavOption {
  id: string;
  context_key: string;
  label: string;
  icon: string;
  description: string;
  order: number;
  href: string;
  agent_prompt: string | null;
  schema_hint: string | null;
  created_at: string;
  updated_at: string;
  agent_id: string | null;
  required_entitlements: string[];
  section: string | null;
  section_order: number;
}

// Lazy load the heavy DynamicContextPage component
const DynamicContextPage = lazy(() => import('../../components/DynamicContextPage'));

// Enhanced loading component - standardized to match login modal
function DashboardLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <img src="/logos/brilliant-icon.png" alt="Brilliant Icon" width={40} height={40} />
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3E5E17] mb-4"></div>
          <p className="text-sm font-medium text-gray-800 mb-2">Loading Dashboard</p>
          <p className="text-xs text-gray-600 text-center">
            Setting up your personalized experience...
          </p>
          <div className="mt-4 flex space-x-1">
            <div className="w-2 h-2 bg-[#3E5E17] rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-[#DD8D00] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-[#74A78E] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient({
  initialSession,
  initialContexts,
  initialContextConfig,
  initialNavOptions,
  defaultContextKey,
}: {
  initialSession: Session | null;
  initialContexts: Context[];
  initialContextConfig?: Context;
  initialNavOptions?: NavOption[];
  defaultContextKey?: string;
}) {
  return (
    <SupabaseProvider initialSession={initialSession}>
      <Suspense fallback={<DashboardLoader />}>
        <DynamicContextPage
          initialContexts={initialContexts}
          initialContextConfig={initialContextConfig}
          initialNavOptions={initialNavOptions}
          defaultContextKey={defaultContextKey}
        />
      </Suspense>
    </SupabaseProvider>
  );
}