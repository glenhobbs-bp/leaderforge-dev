# How to Add or Change Themes (Colors, Branding)

This guide explains how to add or change **Themes** in the LeaderForge platform. Themes control the colors, gradients, and branding for each context (brand/tenant).

---

## What is a Theme?
- A **Theme** is a set of colors and branding settings for a brand or tenant.
- Themes control the look and feel of the app (backgrounds, text, buttons, etc.).

---

## How to Add or Change a Theme

1. **Open Supabase**
   - Go to the Supabase dashboard for your project.

2. **Find the context you want to update**
   - Go to the `core.context_configs` table.
   - Find the row for your brand or tenant.

3. **Edit the `theme` field**
   - The `theme` field is a JSON object with color values.
   - Example:
     ```json
     {
       "primary": "#3E5E17",
       "secondary": "#74A78E",
       "accent": "#DD8D00",
       "bg_light": "#F8F4F1",
       "bg_neutral": "#E3DDC9",
       "text_primary": "#222222",
       "bg_gradient": "linear-gradient(135deg, #74A78E 0%, #DD8D00 50%, #3E5E17 100%)"
     }
     ```
   - Change the color values as needed.

4. **Save your changes**
   - The app will use the new theme automatically.

5. **Test your changes**
   - Switch to the context in the app and check the new colors and branding.

---

## Where are Themes Defined?
- **Theme Table:** `core.context_configs` (Supabase, `theme` field)
- **Frontend Loader:** `apps/web/hooks/useContextConfig.ts`
- **Theme Application:** `apps/web/components/ui/ThemeContext.tsx`

If you need help, ask a developer to assist with Supabase or code changes.