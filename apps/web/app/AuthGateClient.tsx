// File: app/AuthGateClient.tsx
// Purpose: Client-side auth gate that renders children only if the user is logged in

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function AuthGateClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setIsAuthenticated(true);
      } else {
        router.push('/login');
      }

      setIsLoading(false);
    };

    checkSession();
  }, [router]);

  if (isLoading) {
    return <div className="text-center p-8 text-gray-500">Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : null;
}