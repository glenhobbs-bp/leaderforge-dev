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

export default async function RootLayout({
  children
}: {
  children: ReactNode
}) {
  // Get initial session server-side for SSR using the same restoration logic
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
  if (!projectRef) {
    console.error('[layout] NEXT_PUBLIC_SUPABASE_PROJECT_REF is not set');
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

  console.log('[layout] Token debug:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenLength: accessToken?.length || 0,
    refreshTokenLength: refreshToken?.length || 0,
    projectRef
  });

  const supabase = createSupabaseServerClient(cookieStore);

  let initialSession = null;

  // CRITICAL: Only attempt session restoration if we have BOTH tokens
  // Access tokens are JWTs (longer), refresh tokens can be shorter (even 12 chars is valid)
  if (accessToken && refreshToken && accessToken.length > 50 && refreshToken.length > 3) {
    try {
      console.log('[layout] Attempting session restoration with valid tokens');

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.warn('[layout] setSession error:', error);
        // Don't set initialSession - let client handle this
      } else if (data.session?.user?.id) {
        console.log('[layout] Session restored successfully');
        initialSession = data.session;
      } else {
        console.warn('[layout] Session restoration returned no user');
      }
    } catch (error) {
      console.error('[layout] Session restoration failed:', error);
      // Don't set initialSession - let client handle this
    }
  } else {
    console.log('[layout] No valid tokens found - no session restoration attempted');
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
