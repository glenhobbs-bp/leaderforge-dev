# How to Add or Change LangGraph Agent Orchestration

This guide explains how to add or change **LangGraph Agent Orchestration** in the LeaderForge platform. LangGraph agents are advanced AI workflows that can handle multi-step tasks and coordinate tools.

---

## What is LangGraph Agent Orchestration?
- **LangGraph** is a system for building smart AI agents that can do complex, multi-step tasks.
- A LangGraph agent can:
  - Understand user intent
  - Call tools
  - Generate UI layouts
  - Make decisions step-by-step

---

## How to Add a New LangGraph Agent

1. **Decide what the agent should do**
   - Example: "I want an agent that helps users find and compare videos."

2. **Ask a developer to create the agent workflow**
   - The developer will:
     - Add a new file in `packages/agent-core/agents/` (e.g., `VideoCompareAgent.ts`).
     - Use the LangGraph library to define the agent's steps and logic.
     - Make sure the agent returns a valid `ComponentSchema` for the UI.

3. **Register the agent**
   - Update `AgentRegistry.ts` (if used) to register the new agent.
   - Add the agent to the `core.agents` table in Supabase (with its ID and config).

4. **Connect the agent to the UI**
   - In Supabase, set the `agent_id` for the relevant nav option in `core.nav_options`.
   - The UI will call the agent when the nav option is selected.

5. **Test the agent**
   - Use the app to trigger the agent and check its behavior.

---

## How to Change an Existing LangGraph Agent

1. **Decide what you want to change**
   - Example: "I want the agent to ask a follow-up question."

2. **Ask a developer to update the agent workflow**
   - The developer will:
     - Update the agent file in `packages/agent-core/agents/`.
     - Update the registration in `AgentRegistry.ts` if needed.

3. **Test your changes**
   - Use the app to trigger the agent and check the results.

---

## Where are LangGraph Agents Defined?
- **Agent Code:** `packages/agent-core/agents/`
- **Agent Registry:** `packages/agent-core/agents/AgentRegistry.ts` (if used)
- **Database Table:** `core.agents` (Supabase)
- **Nav Option Table:** `core.nav_options` (Supabase)

If you need help, ask a developer to assist with the code or database changes.