import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import "./copilotkit-styles.css";
import { restoreSession } from './lib/supabaseServerClient';
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

  // Use consistent restoreSession logic that only requires access token
  console.log('[layout] Attempting session restoration...');
  const { session: initialSession, error } = await restoreSession(cookieStore);

  if (error) {
    console.warn('[layout] Session restoration failed:', error.message);
  } else if (initialSession?.user?.id) {
    console.log('[layout] ✅ Session restored successfully for user:', initialSession.user.id);
  } else {
    console.log('[layout] No session restored - no valid session found');
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
