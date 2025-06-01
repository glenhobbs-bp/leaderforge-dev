# Feature Flags in LeaderForge

## Overview

Feature flags are used throughout the LeaderForge platform to enable, disable, or gradually roll out features, tools, and experiments without redeploying code. This supports incremental rollout, A/B testing, kill switches, and rapid iteration.

We use [PostHog](https://posthog.com) as our feature flag and analytics provider. All flag checks are abstracted through a single TypeScript service, ensuring flexibility and vendor independence.

---

## Architecture

- **Provider:** PostHog (cloud or self-hosted)
- **Abstraction:** `packages/agent-core/featureFlags.ts`
- **Integration Points:**
  - Backend (API, agent orchestration, tool registry)
  - Frontend (CopilotKit UI, navigation, conditional rendering)
- **Environment Variables:**
  - `POSTHOG_API_KEY` (in `.env.local` at repo root)
  - `POSTHOG_HOST` (optional, defaults to `https://app.posthog.com`)

---

## Usage Pattern

### 1. **Checking a Feature Flag (Backend/Agent)**

```ts
import { isFeatureEnabled } from "packages/agent-core/featureFlags";

const enabled = await isFeatureEnabled("my-feature-flag", userId, contextKey);
if (enabled) {
  // Run gated logic
}
```

### 2. **Fetching All Flags for a User/Context**

```ts
import { getFeatureFlags } from "packages/agent-core/featureFlags";

const flags = await getFeatureFlags(userId, contextKey);
if (flags["my-feature-flag"]) {
  // Feature is enabled
}
```

### 3. **Agent Tool Registry Integration**

Each agent tool can specify a `featureFlag` property. The registry will only expose tools if the flag is enabled for the user/context.

```ts
export const myTool: AgentTool = {
  name: "myTool",
  featureFlag: "my-tool-flag",
  // ...
};
```

---

## Best Practices

- **Never check feature flags directly via PostHog SDK in app logic.** Always use the abstraction in `featureFlags.ts`.
- **Name flags clearly** (e.g., `enable-new-dashboard`, `beta-agent-tool-x`).
- **Document flag purpose and expected rollout in PostHog dashboard.**
- **Remove old/unused flags** to keep the codebase clean.
- **Use flags for both backend and frontend gating.**
- **For SSR/edge, preload flags and inject into CopilotKit context if needed.**

---

## Adding/Managing Flags

- Flags are created and managed in the PostHog dashboard.
- Targeting can be by user, org, context, or percentage rollout.
- No code changes are needed to update flag values or targeting.

---

## Example: .env.local

```
POSTHOG_API_KEY=your-posthog-project-api-key
POSTHOG_HOST=https://app.posthog.com
```

---

## References

- [PostHog Feature Flags Docs](https://posthog.com/docs/feature-flags)
- `packages/agent-core/featureFlags.ts`
- `packages/agent-core/tools/ToolRegistry.ts`
