# How to Add or Change Agents

This guide explains how to add or change **Agents** in the LeaderForge platform. Agents are the "brains" that generate content and handle user requests.

---

## What is an Agent?
- An **Agent** is an AI-powered backend service that decides what content or UI to show based on user actions.
- Agents can use tools, fetch data, and return layouts for the app.

---

## How to Add a New Agent

1. **Decide what the new agent should do**
   - Example: "I want an agent that shows a leaderboard."

2. **Ask a developer to create the agent**
   - The developer will:
     - Add a new agent file in `packages/agent-core/agents/` (e.g., `LeaderboardAgent.ts`).
     - Register the agent in `AgentRegistry.ts` (if used).
     - Make sure the agent returns a valid `ComponentSchema`.

3. **Add the agent to the database**
   - Go to Supabase and open the `core.agents` table.
   - Add a new row with the agent's ID, name, and configuration.

4. **Assign the agent to a navigation option**
   - In Supabase, open the `core.nav_options` table.
   - Set the `agent_id` for the nav option you want to use this agent.

5. **Test the new agent**
   - Click the nav option in the app and check that the agent's content appears.

---

## How to Change an Existing Agent

1. **Decide what you want to change**
   - Example: "I want the agent to show a new type of card."

2. **Ask a developer to update the agent code**
   - The developer will:
     - Update the agent file in `packages/agent-core/agents/`.
     - Make sure the agent returns the updated UI.

3. **Test your changes**
   - Use the app to trigger the agent and check the results.

---

## Where are Agents Defined?
- **Agent Code:** `packages/agent-core/agents/`
- **Agent Registry:** `packages/agent-core/agents/AgentRegistry.ts` (if used)
- **Database Table:** `core.agents` (Supabase)
- **Nav Option Table:** `core.nav_options` (Supabase)

If you need help, ask a developer to assist with the code or database changes.