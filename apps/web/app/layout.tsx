import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import "./copilotkit-styles.css";
import { CopilotKitProvider } from "./CopilotKitProvider";
import QueryClientProvider from "./QueryClientProvider";
import SupabaseProvider from '../components/SupabaseProvider';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from './lib/supabaseServerClient';
import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: "LeaderForge",
  description: "Building something epic!",
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children
}: {
  children: ReactNode
}) {
  // Get initial session server-side for SSR using the same restoration logic
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

  const supabase = createSupabaseServerClient(cookieStore);

  let initialSession = null;

  // Use the same session restoration logic as dashboard and root page
  if (accessToken && refreshToken) {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.warn('[layout] setSession error:', error);
      } else if (data.session) {
        console.log('[layout] Session restored successfully');
        initialSession = data.session;
      }
    } catch (error) {
      console.warn('[layout] Session restoration failed:', error);
    }
  }

  // Only get session if we haven't already restored it
  if (!initialSession) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    initialSession = session;
  }

  return (
    <html lang="en">
      <body>
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
