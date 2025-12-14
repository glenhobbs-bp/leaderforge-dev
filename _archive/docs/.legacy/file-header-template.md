# File Header Template

All TypeScript/JavaScript files in the LeaderForge codebase should include a standardized header comment block at the top of the file.

## Template Format

```typescript
// File: path/to/file.ts
// Purpose: Brief description of what this file does and why it exists
// Owner: Team or individual responsible (e.g., "Frontend team", "Backend team", "AI team")
// Tags: comma, separated, tags (e.g., "UI, navigation, context-based")

// Additional structured comments (optional):
// Dependencies: List key external dependencies if relevant
// Exports: List main exports if it's a utility/service file
// Last-Modified: Auto-updated by manifest generator

import statements...
```

## Example Headers

### React Component (Client)
```typescript
"use client";

// File: apps/web/components/ui/NavPanel.tsx
// Purpose: Navigation panel for agent-native app, themed via contextConfig
// Owner: Frontend team
// Tags: UI, navigation, context-based, React

import React from 'react';
```

### React Component (Server)
```typescript
// File: apps/web/components/ServerComponent.tsx
// Purpose: Server-side rendered component for initial data loading
// Owner: Frontend team
// Tags: UI, SSR, React

import React from 'react';
```

### API Route
```typescript
// File: apps/web/app/api/nav/[context_key]/route.ts
// Purpose: API endpoint for fetching navigation options filtered by user entitlements
// Owner: Backend team
// Tags: API, Next.js, authentication, navigation

import { NextRequest, NextResponse } from 'next/server';
```

### Service/Utility
```typescript
// File: apps/web/app/lib/entitlementService.ts
// Purpose: Core service for user entitlement validation and permission checking
// Owner: Backend team
// Tags: security, entitlements, business-logic, utility

export const entitlementService = {
```

### Agent/AI
```typescript
// File: packages/agent-core/agents/ContentLibraryAgent.ts
// Purpose: LangGraph agent for content discovery and recommendation
// Owner: AI team
// Tags: AI agent, LangGraph, content, recommendation

import { StateGraph } from "@langchain/langgraph";
```

## Auto-Detection

The manifest generator will also auto-detect tags based on:

- **File location**: `/api/` → API, `/components/` → UI, `/hooks/` → hooks
- **File content**: React imports → React, Supabase → database, LangGraph → AI agent
- **File patterns**: `.test.` → test, `/docs/` → documentation

## Benefits

1. **Automated Documentation**: Manifest generator creates comprehensive docs
2. **Team Ownership**: Clear responsibility assignment
3. **Searchability**: Tags enable quick file discovery
4. **Onboarding**: New developers understand file purposes instantly
5. **Architecture Visibility**: See system structure at a glance

## Integration

- Run `npm run generate-manifest` to update documentation
- Consider adding to git pre-commit hooks
- Manifest outputs to `docs/manifest.json` and `docs/manifest.md`