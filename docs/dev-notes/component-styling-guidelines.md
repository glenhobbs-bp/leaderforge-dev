# LeaderForge Component Styling Guidelines

> **Purpose:** Ensure all UI components are visually consistent, modern, and context-aware across the LeaderForge platform.

---

## 🎨 Core Principles

- **Theme-Driven:** All colors, backgrounds, and accents are set via CSS variables from the current context's theme.
- **Consistent Shape:** Use `rounded-xl` for all cards, panels, and interactive elements.
- **Modern Depth:** Use `shadow` for base, `hover:shadow-lg` and `hover:scale-[1.025]` for interactive elevation.
- **Separation of Concerns:** Layout and spacing via Tailwind; colors and branding via CSS variables.
- **Responsiveness:** All components must be mobile-friendly and adapt to various screen sizes.

---

## 🧩 Theme System

- **Theme is provided via React Context (`ThemeProvider`) and injected as CSS variables at the layout root.**
- **Theme variables:**
  - `--primary`, `--secondary`, `--accent`
  - `--card-bg`, `--panel-bg`, `--bg-light`, `--bg-neutral`
  - `--text-primary`, `--bg-gradient`

**Example:**
```tsx
<div
  style={{
    '--primary': theme.primary,
    '--accent': theme.accent,
    '--card-bg': theme.bg_light,
    '--panel-bg': theme.bg_neutral,
    '--text-primary': theme.text_primary,
    // ...etc
  } as React.CSSProperties}
>
  {/* children */}
</div>
```

---

## 🧱 Card & Panel Base Style

**Use this as the starting point for all card-like components:**

```tsx
<div
  className="bg-[var(--card-bg)] rounded-xl shadow border border-[var(--bg-neutral)] flex flex-col h-full min-h-[340px] transition-transform hover:shadow-lg hover:scale-[1.025] duration-150"
>
  {/* ...content... */}
</div>
```

- **Background:** `bg-[var(--card-bg)]`
- **Border:** `border border-[var(--bg-neutral)]`
- **Corners:** `rounded-xl`
- **Shadow:** `shadow` (base), `hover:shadow-lg` (on hover)
- **Hover Expand:** `hover:scale-[1.025] transition-transform duration-150`

---

## 🟦 Progress Bars & Accents

- **Progress bar fill:**
  - Use `var(--primary)` for in-progress, `var(--accent)` for complete.

```tsx
<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
  <div
    className="h-full rounded-full transition-all duration-300"
    style={{ width: `${progress}%`, background: progress === 100 ? 'var(--accent)' : 'var(--primary)' }}
  />
</div>
```

---

## 🏷️ Pills, Status, and Buttons

- **Pills:** Use subtle backgrounds, or theme colors if contextually important.
- **Buttons:**
  - Primary: `bg-[var(--primary)] text-white hover:bg-[var(--accent)]`
  - Secondary: `bg-gray-900 text-white hover:bg-gray-700`
  - Always use `rounded` and `transition` for smoothness.

---

## 🧑‍💻 Tailwind + CSS Variable Conventions

- **Never hardcode colors in Tailwind classes.**
- **Always reference theme colors via `bg-[var(--...)]`, `text-[var(--...)]`, etc.**
- **Use Tailwind for spacing, layout, typography, and responsiveness.**
- **Use `rounded-xl` for all major containers.**

---

## 🧪 Example: Video Card

```tsx
<div className="bg-[var(--card-bg)] rounded-xl shadow border border-[var(--bg-neutral)] flex flex-col h-full min-h-[340px] transition-transform hover:shadow-lg hover:scale-[1.025] duration-150">
  <div className="relative w-full aspect-video rounded-t-xl overflow-hidden">
    <Image src={image} alt={title} fill className="object-cover rounded-t-xl" />
    {/* Play button overlay, etc. */}
  </div>
  <div className="flex-1 flex flex-col p-4 gap-2">
    <span className="font-semibold text-base line-clamp-1">{title}</span>
    <div className="text-sm text-gray-600 line-clamp-2 mb-2">{description}</div>
    {/* Progress bar, status, actions, etc. */}
  </div>
</div>
```

---

## 📝 Checklist for New Components

- [ ] Uses `bg-[var(--card-bg)]` and `border-[var(--bg-neutral)]`
- [ ] Has `rounded-xl` corners
- [ ] Uses `shadow` and hover effects
- [ ] All colors/accents from theme CSS variables
- [ ] Responsive and mobile-friendly
- [ ] No hardcoded color values
- [ ] Buttons and pills use theme colors
- [ ] Progress bars use `var(--primary)`/`var(--accent)`
- [ ] Layout/spacing via Tailwind utilities

---

## 📚 References
- `apps/web/components/ui/ThemeContext.tsx`
- `apps/web/components/ui/NavPanel.tsx`
- `apps/web/components/ai/ComponentSchemaRenderer.tsx`
- `apps/web/components/ai/ContentSchemaRenderer.tsx`
- `apps/web/components/ui/ThreePanelLayout.tsx`
- `config/contextConfig-*.json` (for theme definitions)

---

> **For questions or updates, see the dev-notes folder or ask the UI lead.**