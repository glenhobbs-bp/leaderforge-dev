# LangGraph Usage in LeaderForge

## Overview
LangGraph (via `@langchain/langgraph`) is used in LeaderForge to orchestrate complex agent flows, multi-step reasoning, and tool invocation. This document outlines best practices for structuring, integrating, and maintaining LangGraph-powered logic in our TypeScript/Node codebase.

---

## Directory Structure & Organization

- **All LangGraph logic lives in:**
  - `packages/agent-core/agents/`
- **Each agent or flow gets its own file/module.**
  - Example: `packages/agent-core/agents/conversationAgent.ts`
- **Shared utilities, types, or subgraphs** go in the same folder or a sibling `utils/` directory.
- **Do NOT scatter agent logic across apps or unrelated packages.**

---

## Integration Points

- **API Layer:**
  - Expose endpoints (e.g., `/api/agent/ask`) that call LangGraph flows in `agent-core/agents/`.
- **Frontend (CopilotKit):**
  - The frontend calls backend endpoints; it does NOT import or run LangGraph directly.
- **Tool Registry:**
  - LangGraph agents can invoke tools from `agent-core/tools/ToolRegistry.ts`.
- **Feature Flags & Entitlements:**
  - Always check feature flags and entitlements before running sensitive agent actions.

---

## Best Practices

- **Keep agent orchestration in `agent-core/agents/` only.**
- **Name files and exports clearly** (e.g., `runConversationAgent`, `teamOnboardingFlow`).
- **Export a single function per agent/flow** for easy API integration.
- **Document each agent/flow** with a comment at the top of the file.
- **Use TypeScript types for all inputs/outputs.**
- **Keep shared logic DRY** (use utility modules if needed).
- **Update this doc if you add new patterns or conventions.**

---

## Example: Minimal Agent Flow

```ts
// packages/agent-core/agents/conversationAgent.ts
import { createGraph, Node, Edge } from "@langchain/langgraph"
import { echoTool } from "../tools/ToolRegistry"

export async function runConversationAgent({ userId, input }: { userId: string; input: string }) {
  const graph = createGraph()
  // Add nodes, edges, and tools as needed
  graph.addNode(new Node({
    id: "start",
    run: async () => ({ message: `Hello, ${userId}!` })
  }))
  // ...add more nodes/edges/tools
  return await graph.run({ start: { input } })
}
```

---

## API Integration Example

```ts
// apps/api/routes/agent/ask.ts
import { runConversationAgent } from "packages/agent-core/agents/conversationAgent"

export default async function handler(req, res) {
  const { userId, input } = req.body
  const result = await runConversationAgent({ userId, input })
  res.json(result)
}
```

---

## Summary
- **All LangGraph logic lives in `agent-core/agents/`.**
- **APIs call exported agent/flow functions.**
- **Frontend never runs LangGraph directly.**
- **Keep code modular, typed, and documented.**

Refer to this doc for onboarding, code reviews, and when adding new agent flows.