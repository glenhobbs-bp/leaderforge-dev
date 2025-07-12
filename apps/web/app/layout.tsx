import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import "./copilotkit-styles.css";
import { createSupabaseServerClient } from './lib/supabaseServerClient';
import { cookies } from 'next/headers';
import SupabaseProvider from '../components/SupabaseProvider';
import { CopilotKitProvider } from './CopilotKitProvider';
import QueryClientProvider from './QueryClientProvider';
import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'LeaderForge',
  description: 'AI-powered leadership development platform',
};

// Extract project reference from Supabase URL (same as middleware)
function getProjectRef(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('[layout] NEXT_PUBLIC_SUPABASE_URL is not set');
    return null;
  }

  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

export default async function RootLayout({
  children
}: {
  children: ReactNode
}) {
  // Get initial session server-side for SSR using the same restoration logic
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const projectRef = getProjectRef();
  if (!projectRef) {
    console.error('[layout] Failed to extract project reference from SUPABASE_URL');
    return (
      <html lang="en">
        <body>
          <div>Configuration error: Missing project reference</div>
        </body>
      </html>
    );
  }

  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

  const supabase = createSupabaseServerClient(cookieStore);
  let initialSession = null;

  // Simplified token validation - if both tokens exist and have reasonable lengths, attempt restoration
  if (accessToken && refreshToken && accessToken.length > 10 && refreshToken.length > 3) {
    try {
      console.log('[layout] Attempting session restoration with tokens (access: %d chars, refresh: %d chars)',
        accessToken.length, refreshToken.length);

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.warn('[layout] Session restoration failed:', error.message);
      } else if (data.session?.user?.id) {
        console.log('[layout] ✅ Session restored successfully for user:', data.session.user.id);
        initialSession = data.session;
      } else {
        console.warn('[layout] Session restoration returned no user');
      }
    } catch (error) {
      console.error('[layout] Session restoration exception:', error);
    }
  } else {
    console.log('[layout] No session restoration - missing or invalid tokens (access: %s, refresh: %s)',
      accessToken ? `${accessToken.length} chars` : 'missing',
      refreshToken ? `${refreshToken.length} chars` : 'missing'
    );
  }

  return (
    <html lang="en">
      <body className="antialiased">
        <QueryClientProvider>
          <SupabaseProvider initialSession={initialSession}>
            <CopilotKitProvider>
              {children}
            </CopilotKitProvider>
          </SupabaseProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
