# Agent Configuration Guide: Scalable, Agentic Content Library

## Overview
This guide describes how to configure and register agents for modular, agent-native applications like LeaderForge. It covers agent table schema, agent types, tool orchestration, prompt design, and best practices for extensibility and maintainability.

---

## 1. Agent Table Schema (core.agents)

Recommended schema:

```sql
CREATE TABLE core.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                -- Internal name
  display_name TEXT,                 -- UI label
  description TEXT,                  -- Admin/UX description
  type TEXT NOT NULL CHECK (type IN ('llm', 'langgraph', 'tool', 'workflow')),
  prompt TEXT,                       -- System prompt (if LLM)
  tools JSONB,                       -- Array of tool names
  model TEXT,                        -- Model name (e.g., "claude-3-opus")
  parameters JSONB,                  -- Model/tool parameters
  config JSONB,                      -- Arbitrary config (e.g., LangGraph)
  version INTEGER DEFAULT 1,         -- Versioning for rollback/audit
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

- **Add `version`** for future-proofing and audit.
- **Add a CHECK constraint on `type`** for valid agent types.
- **Keep `description`** for admin UX.

---

## 2. Agent Types

- `llm`: Single-step LLM agent (prompt + tools)
- `langgraph`: Multi-step orchestration (recommended for content library)
- `tool`: Pure tool agent (rare)
- `workflow`: Custom workflow (future)

For content libraries, use `type = 'langgraph'` for maximum flexibility.

---

## 3. Tool Orchestration

Agents should use tools as pure functions:
- **TribeSocialContentTool**: Fetches content, collections, chat, etc.
- **UserProgressTool**: Fetches and updates user progress (watched, worksheet status, etc.)
- **UILayoutTool** (optional): Composes/validates UI schema (grid, cards, progress bars)
- **AnalyticsTool** (optional): Logs views, completions, etc.

Tools should be generic and reusable. The agent decides which tools to call and how to compose the results.

---

## 4. Prompt Design

Prompts should:
- Clearly describe the agent's role and output format
- Instruct the agent to use tools for all data fetching
- Specify UI/UX requirements (e.g., grid of cards, progress bars, action buttons)
- Forbid hardcoding of content/layout; always use tool outputs
- Require output as a ContentSchema JSON object

**Example Prompt:**
> You are the LeaderForge Content Library Agent. Generate a dynamic, interactive content panel for the user, showing all available LeaderForge training videos and supporting materials. For each video, display:
> - Title, module number, and thumbnail
> - Description (short, with ellipsis if too long)
> - Progress bar showing how much the user has watched
> - Status indicators for "Video Watched" and "Worksheet Submitted"
> - Action buttons: "Watch" (or "Rewatch" if completed), "Complete" (if eligible)
> - All data must be fetched using the available tools (TribeSocialContentTool, UserProgressTool, etc.)
> - Compose the UI as a grid of cards, matching the provided ContentSchema type.
> - Never hardcode video IDs or layout; always use the latest data from the tools.
> - If the user has not started a video, show "Watch" and a gray progress bar.
> - If the worksheet is not submitted, show a warning indicator.
> - The UI must be responsive and accessible.
> - Return the result as a ContentSchema JSON object.

---

## 5. Example: LeaderForge Content Library Agent

| name                        | display_name                | description                                         | type       | prompt (see above) | tools (jsonb)                                   | model           | parameters (jsonb) | config (jsonb) | version | enabled |
|-----------------------------|-----------------------------|-----------------------------------------------------|------------|--------------------|--------------------------------------------------|------------------|--------------------|----------------|---------|---------|
| leaderforgeContentLibrary   | LeaderForge Content Library | Library of all LeaderForge training videos & content | langgraph  | (see above)        | ["TribeSocialContentTool","UserProgressTool"]    | claude-3-opus    | {"temperature":0.2}| {}             | 1       | true    |

---

## 6. Best Practices for Scalability and Flexibility

- All UI logic is agent-driven: agent decides layout, content, and state based on tool outputs and config
- All data is fetched via tools: no direct DB or API calls from the UI
- All state (progress, completion) is tracked via tools
- UI schema is generic: frontend just renders the ContentSchema
- Configurable: add new content types, layouts, or progress logic by updating agent config or tools, not the UI

---

## 7. Seeding Example

```sql
INSERT INTO core.agents (
  id, name, display_name, description, type, prompt, tools, model, parameters, config, version, enabled, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'leaderforgeContentLibrary',
  'LeaderForge Content Library',
  'Library of all LeaderForge training videos & supporting content',
  'langgraph',
  $$You are the LeaderForge Content Library Agent. Generate a dynamic, interactive content panel for the user, showing all available LeaderForge training videos and supporting materials. For each video, display:
- Title, module number, and thumbnail
- Description (short, with ellipsis if too long)
- Progress bar showing how much the user has watched
- Status indicators for "Video Watched" and "Worksheet Submitted"
- Action buttons: "Watch" (or "Rewatch" if completed), "Complete" (if eligible)
- All data must be fetched using the available tools (TribeSocialContentTool, UserProgressTool, etc.)
- Compose the UI as a grid of cards, matching the provided ContentSchema type.
- Never hardcode video IDs or layout; always use the latest data from the tools.
- If the user has not started a video, show "Watch" and a gray progress bar.
- If the worksheet is not submitted, show a warning indicator.
- The UI must be responsive and accessible.
- Return the result as a ContentSchema JSON object.$$,
  '["TribeSocialContentTool","UserProgressTool"]',
  'claude-3-opus',
  '{"temperature":0.2}',
  '{}',
  1,
  true,
  NOW(),
  NOW()
);
```

---

## 8. FAQ

**Q: Can an agent be used for both nav and chat?**
A: Yes! The agent is a reusable, modular entity.

**Q: How do I add a new tool or workflow?**
A: Add it to the `tools` or `config` column in `core.agents`, and update the agent orchestration logic.

**Q: How do I version or disable an agent?**
A: Use the `version` and `enabled` columns.

---

## 9. References
- See also: `agent-architecture.md`, `database_setup_addendum_UPDATED.md`