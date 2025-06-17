import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import ClientProviders from "./ClientProviders";
import SupabaseProvider from '../components/SupabaseProvider';
// layout.tsx must be a server component for Next.js App Router (for metadata, streaming, etc.)
// All client-only providers (Supabase, CopilotKit) are wrapped in ClientProviders.tsx

// TODO: See enhancements-and-todos.md — move metadata export to a server component or separate file for App Router compliance.
// export const metadata = {
//   title: "LeaderForge",
//   description: "Building something epic!",
// };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          <ClientProviders>
            {children}
          </ClientProviders>
        </SupabaseProvider>
      </body>
    </html>
  );
}
