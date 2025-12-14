'use client';

import { ReactNode } from 'react';
import { CopilotKit } from '@copilotkit/react-core';

export default function CopilotKitProvider({ children }: { children: ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="default">
      {children}
    </CopilotKit>
  );
}