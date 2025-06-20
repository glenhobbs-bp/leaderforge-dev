"use client";
import SupabaseProvider from '../../components/SupabaseProvider';
import { Session } from '@supabase/supabase-js';
import DynamicContextPage from '../../components/DynamicContextPage';

export default function DashboardClient({
  initialSession,
  initialContexts,
  initialContextConfig,
  initialNavOptions,
  defaultContextKey,
}: {
  initialSession: Session | null;
  initialContexts: any[];
  initialContextConfig?: any;
  initialNavOptions?: any;
  defaultContextKey?: string;
}) {
  return (
    <SupabaseProvider initialSession={initialSession}>
      <DynamicContextPage
        initialContexts={initialContexts}
        initialContextConfig={initialContextConfig}
        initialNavOptions={initialNavOptions}
        defaultContextKey={defaultContextKey}
      />
    </SupabaseProvider>
  );
}