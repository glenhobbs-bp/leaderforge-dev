# Colors & Theming

## Overview

LeaderForge uses CSS custom properties for dynamic theming. Colors are resolved at runtime based on the tenant and organization context.

## Theme Resolution

```
Platform Defaults → Tenant Theme (Full) → Organization Override (Partial)
```

## Platform Default Palette

### Brand Colors

| Variable | Default | Usage |
|----------|---------|-------|
| `--primary` | `#2563eb` | Primary actions, links, focus states |
| `--secondary` | `#059669` | Secondary actions, success indicators |
| `--accent` | `#f59e0b` | Highlights, badges, attention |

### Background Colors

| Variable | Default | Usage |
|----------|---------|-------|
| `--background` | `#ffffff` | Page background |
| `--surface` | `#f8fafc` | Card backgrounds, sections |
| `--surface-elevated` | `#ffffff` | Modals, dropdowns, elevated cards |

### Text Colors

| Variable | Default | Usage |
|----------|---------|-------|
| `--text-primary` | `#0f172a` | Headings, primary text |
| `--text-secondary` | `#64748b` | Body text, descriptions |
| `--text-muted` | `#94a3b8` | Placeholders, disabled text |
| `--text-inverse` | `#ffffff` | Text on dark backgrounds |

### Semantic Colors

| Variable | Default | Usage |
|----------|---------|-------|
| `--success` | `#22c55e` | Success states, completions |
| `--warning` | `#f59e0b` | Warnings, caution states |
| `--error` | `#ef4444` | Errors, destructive actions |
| `--info` | `#3b82f6` | Information, tips |

### Border Colors

| Variable | Default | Usage |
|----------|---------|-------|
| `--border` | `#e2e8f0` | Default borders |
| `--border-focus` | `var(--primary)` | Focus ring color |
| `--border-error` | `var(--error)` | Error state borders |

## Color Shades

Each brand color has light/dark variants for hover states and backgrounds:

```css
/* Primary color scale */
--primary-50: #eff6ff;   /* Light background */
--primary-100: #dbeafe;  /* Hover background */
--primary-500: #3b82f6;  /* Default */
--primary-600: #2563eb;  /* Hover */
--primary-700: #1d4ed8;  /* Active/pressed */
--primary-900: #1e3a8a;  /* Dark variant */
```

## Tenant Theming

Tenants can customize all theme variables through the admin interface.

### Theme Configuration Type

```typescript
interface TenantTheme {
  // Brand
  primary: string;
  secondary: string;
  accent: string;
  
  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Additional
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  fontFamily: 'inter' | 'system' | string;
}
```

### Applying Theme

```typescript
// Server Component
export default async function Layout({ children }) {
  const theme = await resolveTheme(tenant, organization);
  
  return (
    <html style={themeToCSS(theme)}>
      {children}
    </html>
  );
}

function themeToCSS(theme: Theme): React.CSSProperties {
  return {
    '--primary': theme.primary,
    '--secondary': theme.secondary,
    '--accent': theme.accent,
    '--background': theme.background,
    // ... etc
  } as React.CSSProperties;
}
```

## Organization Override

Organizations can override specific properties:

| Property | Can Override |
|----------|--------------|
| Logo | ✅ Yes |
| Primary color | ✅ Yes |
| Secondary color | ❌ No (uses tenant) |
| Accent color | ❌ No (uses tenant) |
| Typography | ❌ No (uses tenant) |
| Border radius | ❌ No (uses tenant) |

### Override Configuration

```typescript
interface OrganizationBranding {
  logoUrl?: string;
  primaryColor?: string;
  displayName?: string;
  useTenantTheme: boolean; // If true, ignore overrides
}
```

## Dark Mode (Future)

The color system supports dark mode through alternate values:

```css
/* Light mode (default) */
:root {
  --background: #ffffff;
  --surface: #f8fafc;
  --text-primary: #0f172a;
}

/* Dark mode */
:root.dark {
  --background: #0f172a;
  --surface: #1e293b;
  --text-primary: #f8fafc;
}
```

> **Note**: Dark mode is deferred for MVP. Schema supports it for future implementation.

## Accessibility Requirements

### Color Contrast

All color combinations must meet WCAG 2.1 AA:

| Combination | Minimum Ratio |
|-------------|---------------|
| Normal text on background | 4.5:1 |
| Large text on background | 3:1 |
| UI components | 3:1 |
| Focus indicators | 3:1 |

### Testing Tools

- Chrome DevTools color contrast checker
- axe DevTools browser extension
- Contrast ratio calculators

### Safe Color Combinations

| Text Color | Background | Ratio |
|------------|------------|-------|
| `--text-primary` | `--background` | 15.1:1 ✅ |
| `--text-secondary` | `--background` | 5.3:1 ✅ |
| `--text-inverse` | `--primary` | 8.6:1 ✅ |
| `--text-primary` | `--surface` | 14.2:1 ✅ |

## Usage Examples

### Tailwind Classes

```jsx
// Using theme colors in components
<button className="bg-primary text-white hover:bg-primary-600">
  Primary Button
</button>

<div className="bg-surface border border-border rounded-lg">
  Card content
</div>

<p className="text-secondary">
  Secondary text
</p>
```

### CSS Variables in Custom Styles

```css
.custom-component {
  background-color: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-primary);
}

.custom-component:focus {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
```

## Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          50: 'var(--primary-50)',
          // ... shades
        },
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        background: 'var(--background)',
        surface: 'var(--surface)',
        border: 'var(--border)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
      },
    },
  },
};
```

