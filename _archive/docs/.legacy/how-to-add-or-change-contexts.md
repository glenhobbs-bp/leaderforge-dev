# How to Add or Change Contexts (Brands/Tenants)

This guide explains how to add or change **Contexts** in the LeaderForge platform. Contexts control branding, navigation, and configuration for each brand or tenant (like "Brilliant" or "LeaderForge").

---

## What is a Context?
- A **Context** is a bundle of settings for a brand or tenant.
- It controls the logo, colors, navigation menu, and more.

---

## How to Add a New Context

1. **Open Supabase**
   - Go to the Supabase dashboard for your project.

2. **Add a new context config**
   - Go to the `core.context_configs` table.
   - Add a new row with:
     - `context_key`: a unique ID (e.g., `mybrand`)
     - `display_name`: the brand name
     - `theme`: a JSON object with colors and branding
     - `logo_url`: link to the logo image
     - (Optional) `i18n`, `settings`, etc.

3. **Add navigation options**
   - Go to the `core.nav_options` table.
   - Add rows for each menu item you want in this context.
   - Set the `context_key` to match your new context.
   - Fill in `label`, `icon`, `description`, `order`, and `route`.

4. **Test your new context**
   - In the app, switch to your new context and check the branding and navigation.

---

## How to Change an Existing Context

1. **Open Supabase**
   - Go to the `core.context_configs` table.

2. **Edit the context row**
   - Update the `theme`, `logo_url`, or other fields as needed.

3. **Edit navigation options**
   - Go to the `core.nav_options` table.
   - Update, add, or remove nav options for your context.

4. **Test your changes**
   - Switch to the context in the app and check the updates.

---

## Where are Contexts and Nav Options Defined?
- **Context Config Table:** `core.context_configs` (Supabase)
- **Nav Options Table:** `core.nav_options` (Supabase)
- **Frontend Loader:** `apps/web/hooks/useContextConfig.ts`
- **Theme Application:** `apps/web/components/ui/ThemeContext.tsx`

If you need help, ask a developer to assist with Supabase or code changes.