'use client';

import { ReactNode, useState } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { CopilotKit } from '@copilotkit/react-core';

export default function ClientProviders({ children }: { children: ReactNode }) {
  const [supabaseClient] = useState(() => createPagesBrowserClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <CopilotKit runtimeUrl="/api/copilotkit" agent="default">
        {children}
      </CopilotKit>
    </SessionContextProvider>
  );
}