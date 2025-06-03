# How to Add or Change Styles (Spacing, Borders, etc.)

This guide explains how to change the **Styles** of the LeaderForge platform. Styles control things like spacing, border radius, and shadows for the panels and components.

---

## What are Styles?
- **Styles** are the rules for how things look: spacing, padding, border radius, shadows, etc.
- Styles are set in the code using Tailwind CSS classes or inline styles.

---

## How to Change Styles

1. **Decide what you want to change**
   - Example: "I want the NavPanel to have more padding."

2. **Find the right file**
   - For the NavPanel: `apps/web/components/ui/NavPanel.tsx`
   - For the main layout: `apps/web/components/ui/ThreePanelLayout.tsx`
   - For content widgets: `apps/web/components/ai/ComponentSchemaRenderer.tsx`

3. **Ask a developer to update the styles**
   - The developer will:
     - Change the Tailwind classes or inline styles in the relevant file.
     - Example: Change `p-4` to `p-6` for more padding.

4. **Test your changes**
   - View the app and check that the style looks as you want.

---

## Where are Styles Defined?
- **UI Components:** `apps/web/components/ui/`
- **Content Renderer:** `apps/web/components/ai/ComponentSchemaRenderer.tsx`
- **Global CSS (rare):** `apps/web/app/globals.css`

If you need help, ask a developer to assist with the code changes.