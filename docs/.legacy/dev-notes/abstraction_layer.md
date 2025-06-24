# Abstraction Layer (Service Layer) Architecture

## Purpose & Motivation
- Centralizes all entitlement, context, and data access logic.
- Normalizes and secures data for agents and frontend.
- Decouples UI/agent logic from database and external APIs.
- Provides a single, testable API for all context, nav, theme, and content queries.

## Why This Layer Is Critical
- **Security:** All entitlement checks are enforced here. Never trust the agent or frontend to enforce security.
- **Consistency:** Ensures all modules and agents see the same data and logic.
- **Extensibility:** Makes it easy to add new data sources, APIs, or business rules without changing agent/frontend code.
- **Maintainability:** Centralizes business logic for easier testing and updates.

## Responsibilities
- Expose API endpoints (REST or tRPC) for:
  - Fetching context config (theme, branding, i18n, etc.)
  - Fetching nav options for a context (with entitlement filtering)
  - Fetching content for a context/nav (with entitlement filtering)
  - (Optionally) exposing agent prompts, layouts, etc.
- Enforce all entitlement checks before returning any data.
- Aggregate/join data from Supabase and external APIs (e.g., Tribe Social content, analytics).
- Return data in a frontend/agent-friendly format (e.g., ContentSchema).

## Example API Endpoints
- `GET /api/context/:context_key` → returns context config, theme, i18n, etc.
- `GET /api/nav/:context_key` → returns nav options for the context, filtered by user entitlement
- `GET /api/content?context_key=...&nav=...` → returns ContentSchema for the nav/context, entitlement-checked
- `GET /api/entitlements/:user_id` → returns user's entitlements

## Implementation Tips
- Use TypeScript for strong typing and future-proofing.
- Use Supabase client for DB access, and wrap all queries in service functions.
- If you need to call external APIs (like Tribe Social), do it in this layer, not in the agent or frontend.
- Always pass user context (user id, org, entitlements) to every service call.
- Write unit tests for all service functions, especially entitlement logic.

## Key Principles to Remember
- **Never bypass this layer for data access.**
- **All entitlement and context logic lives here.**
- **Frontend and agents are consumers only.**
- **This layer is the contract for all UI/agent data.**

## Next Steps
- Scaffold the abstraction layer in your backend (Node/TypeScript).
- Update agent and frontend APIs to use this layer exclusively.
- Remove all static config and direct DB access from frontend/agent code.

---

_This document is a living architectural record. All changes to data access, entitlement, or context logic must be reflected here._

---

## Reference Implementation

### Directory Structure

```
apps/web/app/
  api/
    context/[context_key]/route.ts        # GET context config
    nav/[context_key]/route.ts            # GET nav options
    content/[context_key]/route.ts        # GET content for context
    entitlements/[user_id]/route.ts       # GET user entitlements
    copilotkit/route.ts                   # (existing CopilotKit endpoint)
  lib/
    supabaseClient.ts                     # Supabase client
    contextService.ts                     # Context config service
    navService.ts                         # Nav options service
    contentService.ts                     # Content service
    entitlementService.ts                 # Entitlement service
    index.ts                              # Service exports
```

### Example Service (TypeScript)

```ts
// apps/web/app/lib/contextService.ts
import { supabase } from './supabaseClient';

export async function getContextConfig(contextKey: string) {
  const { data, error } = await supabase
    .from('context_configs')
    .select('*')
    .eq('context_key', contextKey)
    .single();
  if (error) throw error;
  return data;
}
```

### Example API Route (Next.js App Router)

```ts
// apps/web/app/api/context/[context_key]/route.ts
import { NextRequest } from 'next/server';
import { getContextConfig } from '../../../lib/contextService';

export async function GET(req: NextRequest, { params }: { params: { context_key: string } }) {
  try {
    const config = await getContextConfig(params.context_key);
    return new Response(JSON.stringify(config), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
```

### Notes
- All business/data logic is in the service layer (`lib/`).
- API routes are thin wrappers that call the service layer and return JSON.
- Entitlement and external API logic can be added to the service files.
- This pattern is used for all context, nav, content, and entitlement endpoints.

## Navigation options table
CREATE TABLE core.nav_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  context_key TEXT REFERENCES core.context_configs(context_key) ON DELETE CASCADE,
  label TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  "order" INTEGER,
  route TEXT,
  agent_prompt TEXT,
  schema_hint JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);