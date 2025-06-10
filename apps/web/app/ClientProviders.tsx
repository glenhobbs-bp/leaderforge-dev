"use client";
// This component wraps all client-only providers (Supabase, CopilotKit, etc.)
// It is required because Next.js App Router expects layout.tsx to be a server component for metadata/streaming.
// Only client components can use React hooks and context providers like SessionContextProvider.
import { ReactNode } from "react";
import { supabase } from "./lib/supabaseClient";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { CopilotKit } from "@copilotkit/react-core";

export default function ClientProviders({ children }: { children: ReactNode }) {
  // console.log('[ClientProviders] Rendering SessionContextProvider and CopilotKit');
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <CopilotKit runtimeUrl="/api/copilotkit" agent="default">
        {children}
      </CopilotKit>
    </SessionContextProvider>
  );
}