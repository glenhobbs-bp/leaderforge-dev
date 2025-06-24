# CopilotKit Usage in LeaderForge

## Overview

CopilotKit powers the AI-native conversational UI in LeaderForge. It provides composable React components, context management, and seamless integration with backend agent APIs. This document outlines best practices for integrating and maintaining CopilotKit in our Next.js frontend.

---

## Directory Structure & Organization

- **All CopilotKit UI logic lives in:**
  - `apps/web/components/ai/` (recommended)
- **Provider and panel components** are added to the main layout or 3-panel experience.
- **Custom CopilotKit hooks or context** go in `apps/web/lib/copilotkit/` if needed.
- **Do NOT scatter CopilotKit logic across unrelated components.**

---

## Integration Points

- **Main Layout:**
  - Wrap the app (or relevant section) in `<CopilotProvider>`.
- **Chat/Assistant Panel:**
  - Use `<CopilotPanel />` or custom CopilotKit UI components.
- **Context Injection:**
  - Pass user/session/context info and feature flags to CopilotKit provider.
- **API Communication:**
  - CopilotKit calls backend endpoints (e.g., `/api/agent/ask`) for agent responses.

---

## Best Practices

- **Keep all CopilotKit UI in a dedicated folder.**
- **Inject feature flags and entitlements** into CopilotKit context for entitlement-aware UX.
- **Use TypeScript for all custom hooks and context.**
- **Document custom CopilotKit integrations.**
- **Update this doc if you add new patterns or conventions.**

---

## Example: Main Integration

```tsx
// apps/web/components/ai/AIExperience.tsx
import { CopilotProvider, CopilotPanel } from "@copilotkit/react-ui";
import { useSession } from "@/lib/session";

export default function AIExperience() {
  const session = useSession();
  // Fetch feature flags, entitlements, etc.

  return (
    <CopilotProvider
      userId={session.user.id}
      contextKey={session.contextKey}
      featureFlags={session.featureFlags}
      // ...other config
    >
      <CopilotPanel />
      {/* ...other panels */}
    </CopilotProvider>
  );
}
```

---

## Example: API Communication

```ts
// apps/web/lib/copilotkit/useAgentChat.ts
export async function sendAgentMessage({ userId, contextKey, message }) {
  const res = await fetch("/api/agent/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, contextKey, message }),
  });
  return await res.json();
}
```

---

## Summary

- **All CopilotKit UI lives in `components/ai/` (or similar).**
- **Provider and panels are added to the main layout.**
- **Context and feature flags are injected for entitlement-aware UX.**
- **CopilotKit communicates with backend agent APIs.**
- **Keep code modular, typed, and documented.**

Refer to this doc for onboarding, code reviews, and when adding new CopilotKit-powered features.
