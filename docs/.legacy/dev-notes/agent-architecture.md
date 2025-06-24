# LeaderForge Agent Architecture: Modular, Extensible, and Future-Proof

> **Note:** For up-to-date agent configuration patterns, see [Agent Configuration Guide](./agent-configuration-guide.md).

## Overview

This document describes the **modular agent architecture** for LeaderForge, supporting:
- Centralized agent definitions (prompts, tools, workflows, config)
- Clean separation between UI navigation and agent logic
- Support for both simple LLM agents and complex LangGraph automations
- Versioning, auditing, and future extensibility

---

## 1. Motivation

- **Old Pattern:**
  - `agent_prompts` table (or `agent_prompt` field on `core.nav_options`)
  - Tight coupling of UI navigation and agent logic
  - Difficult to manage, extend, or reuse agents

- **New Pattern:**
  - Dedicated `core.agents` table
  - All agent config (prompt, tools, workflow, model, etc.) in one place
  - `core.nav_options` references agents by `agent_id`
  - Supports both single-agent and multi-step (LangGraph) automations

---

## 2. Database Schema

### `core.agents` Table

```sql
CREATE TABLE core.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('llm', 'langgraph', 'tool', 'workflow')),
  prompt TEXT,
  tools JSONB,         -- e.g., ["TribeSocialContentTool"]
  model TEXT,          -- e.g., "claude-3-opus"
  parameters JSONB,    -- e.g., {"temperature": 0.2}
  config JSONB,        -- Arbitrary config for LangGraph, etc.
  version INTEGER DEFAULT 1,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `core.nav_options` Table (Reference)

```sql
ALTER TABLE core.nav_options
  ADD COLUMN agent_id UUID REFERENCES core.agents(id);
```

---

## 3. Agent Definition Example

| id (UUID) | name         | type      | prompt                | tools                        | model           | parameters           | config         | version | enabled |
|-----------|--------------|-----------|-----------------------|------------------------------|------------------|----------------------|----------------|---------|---------|
| ...       | libraryAgent | "llm"     | "You are the Content Discovery Agent..." | ["TribeSocialContentTool"] | "claude-3-opus" | {"temperature":0.2} | {}             | 1       | true    |
| ...       | progressAgent| "llm"     | "You are the Progress Tracker Agent..."  | []                         | "claude-3-opus" | {"temperature":0.1} | {}             | 1       | true    |
| ...       | teamInsights | "langgraph"| null                  | ["TeamAnalyticsTool"]        | null             | {}                   | {graphConfig}  | 1       | true    |

---

## 4. Universal Agent Invocation Pattern

### Core Principle: Single Route to Agents
All agent interactions follow the same universal pattern regardless of agent type:

1. **User Action** (nav click, chat message, etc.)
2. **Frontend** sends request to single agent API endpoint: `/api/agent/content`
3. **Agent API**:
   - Authenticates user
   - Looks up navigation option → gets `agent_id`
   - Loads agent config from `core.agents`
   - **Routes to appropriate agent type handler:**
     - `type: "llm"` → Direct LLM call with tools
     - `type: "langgraph"` → LangGraph HTTP API call
     - `type: "tool"` → Direct tool execution
     - `type: "workflow"` → Custom workflow execution
4. **Agent Processing**:
   - Agent uses registered tools to fetch/process data
   - Agent returns **standardized ComponentSchema response**
5. **Frontend** renders ComponentSchema using `ComponentSchemaRenderer`

### Universal Response Format
All agents must return responses conforming to `ComponentSchema` types:

```typescript
interface AgentResponse {
  type: "content_schema";
  content: ComponentSchema; // Grid, Card, Panel, etc.
  metadata?: any;
}
```

### ComponentSchema Structure
All UI components must follow the props-wrapped pattern:

```typescript
// Correct: Props-wrapped structure
{
  type: "Grid",
  props: {
    columns: 3,
    items: [
      {
        type: "Card",
        props: {
          title: "Video Title",
          description: "Description",
          actions: [...]
        }
      }
    ]
  }
}
```

### Agent-Tool Orchestration
Each agent type handles tool orchestration differently:

- **LangGraph Agents**: Define tools in their state graph, invoke tools via LangChain tool calling
- **LLM Agents**: Use function calling to invoke registered tools
- **Tool Agents**: Direct tool execution without LLM orchestration
- **Workflow Agents**: Custom business logic with optional tool usage

**Key Principle**: Tools do the work, agents orchestrate and format responses.

### Example Flow: Leadership Library
1. User clicks "Leadership Library" → `/api/agent/content`
2. API looks up nav option → finds `agent_id` for `leaderforgeContentLibrary`
3. API finds agent type `langgraph` → routes to LangGraph HTTP API
4. LangGraph agent invokes `TribeSocialContentTool`
5. Tool fetches videos from TribeSocial API
6. Agent transforms tool response → ComponentSchema Grid format
7. Frontend renders video grid using ComponentSchemaRenderer

---

## 5. Why Not Just `agent_prompt` on Nav Option?

- **Duplication:** Multiple nav options may use the same agent logic.
- **Extensibility:** You'll want to add more config (tools, model, workflow, etc.) over time.
- **Separation of Concerns:** UI config (nav) should not contain agent logic.
- **Reusability:** Agents can be reused across nav options, chat, automations, etc.
- **Versioning:** Centralized agent table allows for versioning and audit.

---

## 6. Migration Plan

1. **Create `core.agents` table** (see schema above).
2. **Add `agent_id` to `core.nav_options`**.
3. **Migrate existing prompts/config from `agent_prompts` to `core.agents`**.
4. **Update all code to use agent lookup via `agent_id`**.
5. **Drop the old `agent_prompts` table** once migration is complete and verified.

---

## 7. Example: Content Library Agent

**Agent Row:**
| name         | type | prompt | tools                        | model           | parameters           |
|--------------|------|--------|------------------------------|------------------|----------------------|
| libraryAgent | llm  | "You are the Content Discovery Agent..." | ["TribeSocialContentTool"] | "claude-3-opus" | {"temperature":0.2} |

**Nav Option Row:**
| label                | href      | agent_id (FK) |
|----------------------|-----------|--------------|
| "Brilliant+ Library" | /library  | (UUID of libraryAgent) |

---

## 8. Extending for LangGraph and Multi-Agent

- Add a `type` column (`llm`, `langgraph`, etc.)
- Store LangGraph workflow config in the `config` JSONB column
- Add a `tools` array for tool orchestration
- Add `parameters` for model/tool config

---

## 9. Versioning and Audit

- Add `version` and `enabled` columns to `core.agents`
- Optionally, add an audit log or history table for agent changes

---

## 10. Example Query

```sql
-- Get agent config for a nav option
SELECT a.*
FROM core.nav_options n
JOIN core.agents a ON n.agent_id = a.id
WHERE n.id = $1;
```

---

## 11. Next Steps

1. **Implement the schema changes** (create `core.agents`, add `agent_id` to `core.nav_options`).
2. **Migrate data** from `agent_prompts` to `core.agents`.
3. **Update backend logic** to use agent lookup and config.
4. **Drop the old `agent_prompts` table**.
5. **Document agent creation and management for future devs/admins.

---

## 12. FAQ

**Q: Can an agent be used for both nav and chat?**
A: Yes! The agent is now a reusable, modular entity.

**Q: How do I add a new tool or workflow?**
A: Add it to the `tools` or `config` column in `core.agents`, and update the agent orchestration logic.

**Q: How do I version or disable an agent?**
A: Use the `version` and `enabled` columns.

---

## 13. Secure API/Tool Integration

### Where to Define Integrations
- **Agent Table:** Reference tool names (e.g., `tools: ["TribeSocialContentTool"]`) and non-secret config in `config`.
- **Tool Implementation:** Implemented in backend code, reads secrets from environment variables.

### Storing Credentials
- **Environment Variables:** Store all API keys/secrets in `.env` or your cloud secret manager. Never in the DB.
- **Tool Reads from Env:**
  ```ts
  const apiKey = process.env.TRIBE_SOCIAL_API_KEY;
  ```
- **Never in DB or Frontend:** Only reference tool names/config in DB.

### Security Best Practices
- Principle of least privilege: Only expose secrets to the backend process that needs them.
- Never store or expose API keys in the database or frontend.
- Rotate keys regularly; use secret manager in production.
- Log tool usage, but never log secrets.

### Example: Tribe Social Tool Integration

**Agent Table Row:**
| name         | tools                        | config (JSONB)                |
|--------------|-----------------------------|-------------------------------|
| libraryAgent | ["TribeSocialContentTool"]   | {"tribeSocial": {"resultLimit": 5}} |

**Tool Implementation:**
```ts
// agent-core/tools/TribeSocialContentTool.ts
export async function TribeSocialContentTool(query, config) {
  const apiKey = process.env.TRIBE_SOCIAL_API_KEY;
  const apiUrl = process.env.TRIBE_SOCIAL_API_URL;
  // ... use apiKey securely
}
```

**Agent Orchestration:**
- Loads agent config from DB
- Loads tool(s) by name from codebase
- Passes non-secret config from DB, secrets from env

### Summary Table
| What                | Where Stored         | Example/Notes                        |
|---------------------|---------------------|--------------------------------------|
| Tool name           | DB (core.agents)    | "TribeSocialContentTool"             |
| Tool config         | DB (core.agents)    | {"resultLimit": 5}                   |
| API endpoint        | DB or .env          | Prefer .env for flexibility          |
| API key/secret      | .env only           | Never in DB, never in frontend       |
| Tool implementation | Codebase            | Reads secrets from env at runtime    |

---

## 14. Diagram

```mermaid
erDiagram
    NAV_OPTIONS {
      UUID id
      TEXT label
      TEXT href
      UUID agent_id
    }
    AGENTS {
      UUID id
      TEXT name
      TEXT type
      TEXT prompt
      JSONB tools
      TEXT model
      JSONB parameters
      JSONB config
      INTEGER version
      BOOLEAN enabled
    }
    NAV_OPTIONS ||--o{ AGENTS : "references"
```

---

## 15. Deprecation

- The `agent_prompts` table is deprecated and will be dropped after migration.

---

**This architecture is modular, future-proof, and supports both simple and advanced agent orchestration.**