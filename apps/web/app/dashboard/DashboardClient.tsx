"use client";
import SupabaseProvider from '../../components/SupabaseProvider';
import { Session } from '@supabase/auth-helpers-react';
import DynamicContextPage from '../../components/DynamicContextPage';

export default function DashboardClient({
  initialSession,
}: {
  initialSession: Session | null;
}) {
  return (
    <SupabaseProvider initialSession={initialSession}>
      <DynamicContextPage />
    </SupabaseProvider>
  );
}