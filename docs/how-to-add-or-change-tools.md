# How to Add or Change Tools

This guide explains how to add or change **Tools** in the LeaderForge platform. Tools are reusable backend helpers that agents use to get things done.

---

## What is a Tool?
- A **Tool** is a backend helper (like a search, analytics, or content fetcher) that agents can use to answer questions or build UI.
- Tools are like "skills" that agents can call when needed.

---

## How to Add a New Tool

1. **Decide what the tool should do**
   - Example: "I want a tool that fetches user progress."

2. **Ask a developer to create the tool**
   - The developer will:
     - Add a new file in `packages/agent-core/tools/` (e.g., `UserProgressTool.ts`).
     - Export the tool as a class or function.
     - (Optional) Register the tool in `ToolRegistry.ts` if used.

3. **Update agents to use the tool**
   - Ask the developer to update any agent that should use the new tool.

4. **Test the tool**
   - Use the app or a mock agent to check that the tool works as expected.

---

## How to Change an Existing Tool

1. **Decide what you want to change**
   - Example: "I want the tool to return more details."

2. **Ask a developer to update the tool code**
   - The developer will:
     - Update the tool file in `packages/agent-core/tools/`.
     - Update any agents that use the tool if needed.

3. **Test your changes**
   - Use the app or a mock agent to check the results.

---

## Where are Tools Defined?
- **Tool Code:** `packages/agent-core/tools/`
- **Tool Registry:** `packages/agent-core/tools/ToolRegistry.ts` (if used)
- **Agent Usage:** `packages/agent-core/agents/`

If you need help, ask a developer to assist with the code changes.