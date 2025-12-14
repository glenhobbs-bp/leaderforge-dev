# Spacing & Layout

## Overview

LeaderForge uses a 4px base unit spacing system. All spacing values are multiples of 4px for visual consistency and easy alignment.

## Spacing Scale

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `space-0` | 0px | `p-0`, `m-0` | Reset |
| `space-0.5` | 2px | `p-0.5` | Micro adjustments |
| `space-1` | 4px | `p-1`, `gap-1` | Tight spacing, icon gaps |
| `space-1.5` | 6px | `p-1.5` | Small padding |
| `space-2` | 8px | `p-2`, `gap-2` | Compact elements, button padding |
| `space-3` | 12px | `p-3`, `gap-3` | Default padding |
| `space-4` | 16px | `p-4`, `gap-4` | Standard gaps |
| `space-5` | 20px | `p-5`, `gap-5` | Medium spacing |
| `space-6` | 24px | `p-6`, `gap-6` | Section padding |
| `space-8` | 32px | `p-8`, `gap-8` | Large sections |
| `space-10` | 40px | `p-10` | Extra spacing |
| `space-12` | 48px | `p-12` | Page sections |
| `space-16` | 64px | `p-16` | Major sections |
| `space-20` | 80px | `p-20` | Hero sections |

## Common Spacing Patterns

### Component Padding

| Component | Padding | Tailwind |
|-----------|---------|----------|
| Button (sm) | 8px 12px | `py-2 px-3` |
| Button (md) | 10px 16px | `py-2.5 px-4` |
| Button (lg) | 12px 24px | `py-3 px-6` |
| Card | 16px-24px | `p-4` to `p-6` |
| Input | 8px 12px | `py-2 px-3` |
| Modal | 24px | `p-6` |
| Page section | 24px-48px | `py-6` to `py-12` |

### Gap Patterns

| Context | Gap | Tailwind |
|---------|-----|----------|
| Icon + text | 8px | `gap-2` |
| Form fields | 16px | `gap-4` |
| Card grid | 16px-24px | `gap-4` to `gap-6` |
| Section stacking | 32px-48px | `gap-8` to `gap-12` |
| Page sections | 48px-64px | `gap-12` to `gap-16` |

## Container Widths

| Size | Max Width | Usage |
|------|-----------|-------|
| `sm` | 640px | Narrow content, forms |
| `md` | 768px | Reading content |
| `lg` | 1024px | Dashboard content |
| `xl` | 1280px | Wide layouts |
| `2xl` | 1536px | Full-width dashboards |

```jsx
<div className="container mx-auto px-4 max-w-5xl">
  {/* Content constrained to ~1024px */}
</div>
```

## Breakpoints

| Name | Min Width | Target Devices |
|------|-----------|----------------|
| `sm` | 640px | Large phones, small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops, small desktops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large monitors |

### Mobile-First Approach

```jsx
{/* Start mobile, scale up */}
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">
    Responsive Heading
  </h1>
</div>
```

## Layout Patterns

### Page Layout

```jsx
<div className="min-h-screen bg-background">
  {/* Header */}
  <header className="h-16 border-b border-border px-4">
    {/* Nav content */}
  </header>
  
  {/* Main content */}
  <main className="container mx-auto px-4 py-8">
    {/* Page content */}
  </main>
</div>
```

### Dashboard Layout

```jsx
<div className="flex min-h-screen">
  {/* Sidebar */}
  <aside className="w-64 border-r border-border p-4">
    {/* Navigation */}
  </aside>
  
  {/* Main area */}
  <main className="flex-1 p-6">
    {/* Dashboard content */}
  </main>
</div>
```

### Card Grid

```jsx
{/* Responsive grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  <Card />
  <Card />
  <Card />
</div>
```

### Form Layout

```jsx
<form className="space-y-4 max-w-md">
  <div className="space-y-2">
    <label>Field Label</label>
    <input />
  </div>
  
  <div className="space-y-2">
    <label>Another Field</label>
    <input />
  </div>
  
  <div className="flex gap-3 pt-4">
    <button>Cancel</button>
    <button>Submit</button>
  </div>
</form>
```

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-none` | 0px | Sharp corners |
| `rounded-sm` | 2px | Subtle rounding |
| `rounded` | 4px | Default (inputs) |
| `rounded-md` | 6px | Cards, buttons |
| `rounded-lg` | 8px | Larger cards |
| `rounded-xl` | 12px | Modals, panels |
| `rounded-2xl` | 16px | Large panels |
| `rounded-full` | 9999px | Pills, avatars |

### Tenant Theming

Tenants can set a global radius style:

| Style | Button | Card | Input |
|-------|--------|------|-------|
| **Sharp** | `rounded-none` | `rounded-sm` | `rounded-none` |
| **Rounded** | `rounded-md` | `rounded-lg` | `rounded` |
| **Pill** | `rounded-full` | `rounded-2xl` | `rounded-full` |

## Shadows

| Token | Usage |
|-------|-------|
| `shadow-sm` | Subtle depth (inputs) |
| `shadow` | Default cards |
| `shadow-md` | Elevated cards |
| `shadow-lg` | Dropdowns, modals |
| `shadow-xl` | Floating elements |

```jsx
{/* Card with elevation */}
<div className="bg-surface rounded-lg shadow-md p-4">
  Card content
</div>

{/* Modal */}
<div className="bg-surface-elevated rounded-xl shadow-xl p-6">
  Modal content
</div>
```

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `z-0` | 0 | Base layer |
| `z-10` | 10 | Floating elements |
| `z-20` | 20 | Dropdowns |
| `z-30` | 30 | Fixed headers |
| `z-40` | 40 | Modals |
| `z-50` | 50 | Toasts, notifications |

## Aspect Ratios

| Ratio | Usage |
|-------|-------|
| `aspect-video` (16:9) | Video thumbnails |
| `aspect-square` (1:1) | Avatars, icons |
| `aspect-[4/3]` | Content cards |
| `aspect-[3/2]` | Feature images |

```jsx
<div className="aspect-video bg-surface rounded-lg overflow-hidden">
  <img src="..." className="object-cover w-full h-full" />
</div>
```

