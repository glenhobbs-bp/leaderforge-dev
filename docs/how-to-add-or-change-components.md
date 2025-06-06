# How to Add or Change UI Components (Cards, Grids, etc.)

This guide explains how to add or change the building blocks of the LeaderForge user interface, called **Components**. Components are things like Cards, Grids, Panels, and other widgets that make up the main content area.

---

## What is a Component?
- A **Component** is a reusable UI block (like a Card, Grid, or Panel) that displays information or content.
- Components are combined by the system (or agents) to create the main content panel you see in the app.
- **All component schemas must use the `{ type, props }` shape for extensibility and best practice.**

---

## How to Add a New Component

1. **Decide what you want to add**
   - Example: "I want a new 'Chart' component to show a graph."

2. **Ask a developer to add the new component type**
   - The developer will:
     - Add a new type/interface in `packages/agent-core/types/ComponentSchema.ts` (e.g., `ChartSchema`).
     - Add your new type to the `ComponentSchema` union in that file.
     - Add a new `case` in `apps/web/components/ai/ComponentSchemaRenderer.tsx` to render your component.
     - **Ensure the schema uses `{ type, props }` (e.g., `{ type: 'Chart', props: { ... } }`).**

3. **Test the new component**
   - Ask the developer to update a mock agent/tool (like `TribeSocialContentTool.ts`) to return your new component for testing.
   - View the app and check that your new component appears and looks correct.

---

## How to Change an Existing Component

1. **Decide what you want to change**
   - Example: "I want Cards to show a new field called 'author'."

2. **Ask a developer to update the component type**
   - The developer will:
     - Update the relevant interface in `ComponentSchema.ts`.
     - Update the rendering logic in `ComponentSchemaRenderer.tsx`.
     - **Ensure the schema and renderer use `{ type, props }`.**

3. **Test your changes**
   - Use a mock tool or agent to return the updated component and check the UI.

---

## Where are Components Defined?
- **Component Types:** `packages/agent-core/types/ComponentSchema.ts`
- **Component Renderer:** `apps/web/components/ai/ComponentSchemaRenderer.tsx`
- **Mock/Test Data:** `packages/agent-core/tools/TribeSocialContentTool.ts` (for testing)

**Note:**
- The renderer and all tools/agents must always use the `{ type, props }` schema pattern for all components.
- This ensures extensibility, composability, and architectural purity.

If you need help, ask a developer to assist with the code changes.