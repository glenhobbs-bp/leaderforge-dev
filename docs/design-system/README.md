# LeaderForge Design System

## Overview

This design system provides the foundation for all UI development in LeaderForge LMS. It ensures visual consistency, accessibility compliance, and efficient development through reusable patterns.

## Technology Stack

| Tool | Purpose |
|------|---------|
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component primitives |
| **Lucide Icons** | Icon library |
| **CSS Custom Properties** | Dynamic theming |

## Contents

- [Colors & Theming](./colors.md)
- [Typography](./typography.md)
- [Spacing & Layout](./spacing.md)
- [Components](./components.md)

## Quick Reference

### Theme Variables

```css
/* Applied dynamically based on tenant/org */
:root {
  /* Brand Colors */
  --primary: #2563eb;
  --secondary: #059669;
  --accent: #f59e0b;
  
  /* Backgrounds */
  --background: #ffffff;
  --surface: #f8fafc;
  --surface-elevated: #ffffff;
  
  /* Text */
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  
  /* Semantic */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Borders */
  --border: #e2e8f0;
  --border-focus: var(--primary);
}
```

### Spacing Scale (4px base)

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight spacing |
| `space-2` | 8px | Component padding |
| `space-3` | 12px | Small gaps |
| `space-4` | 16px | Standard gaps |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Large sections |
| `space-12` | 48px | Page sections |

### Typography Scale

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-xs` | 12px | 400 | Labels, captions |
| `text-sm` | 14px | 400 | Secondary text |
| `text-base` | 16px | 400 | Body text |
| `text-lg` | 18px | 500 | Emphasized text |
| `text-xl` | 20px | 600 | Small headings |
| `text-2xl` | 24px | 600 | Section headings |
| `text-3xl` | 30px | 700 | Page headings |

### Breakpoints

| Name | Width | Target |
|------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

## Component Library

Built on shadcn/ui with LeaderForge customizations:

### Core Components
- Button (primary, secondary, ghost, destructive)
- Card (default, elevated, interactive)
- Input, Select, Checkbox, Radio
- Dialog, Sheet, Popover
- Table, DataTable
- Tabs, Accordion

### LMS-Specific Components
- ProgressBar (with completion states)
- ContentCard (video, document, course)
- CourseNavigation (modules, lessons)
- UserAvatar (with status)
- CompletionBadge
- TeamSelector

## Accessibility

All components must meet **WCAG 2.1 AA** standards:

- **Color Contrast**: 4.5:1 minimum for text
- **Focus States**: Visible focus indicators
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels
- **Motion**: Respect `prefers-reduced-motion`

## Theming Architecture

### Resolution Order
```
Platform Defaults → Tenant Theme → Organization Override
```

### Tenant Controls (Full)
- All colors
- Logo and favicon
- Font family
- Border radius style

### Organization Controls (Partial)
- Logo override
- Primary color override
- Display name

See [Colors & Theming](./colors.md) for implementation details.
