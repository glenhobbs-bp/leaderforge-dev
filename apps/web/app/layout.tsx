import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import CopilotKitProvider from "./CopilotKitProvider";
import SupabaseProvider from '../components/SupabaseProvider';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from './lib/supabaseServerClient';

// TODO: See enhancements-and-todos.md — move metadata export to a server component or separate file for App Router compliance.
// export const metadata = {
//   title: "LeaderForge",
//   description: "Building something epic!",
// };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get initial session server-side for SSR
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body>
        <SupabaseProvider initialSession={session}>
          <CopilotKitProvider>
            {children}
          </CopilotKitProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
