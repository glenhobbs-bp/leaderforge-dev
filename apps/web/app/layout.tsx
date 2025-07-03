import "./globals.css";
import "@copilotkit/react-ui/styles.css";
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
  // Get initial session server-side for SSR
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body>
        <QueryClientProvider>
          <SupabaseProvider initialSession={session}>
            <CopilotKitProvider>
              {children}
            </CopilotKitProvider>
          </SupabaseProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
