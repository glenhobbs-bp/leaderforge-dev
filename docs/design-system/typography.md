# Typography

## Overview

LeaderForge uses a consistent typography scale based on Inter as the default font family. Tenants can customize the font family through theming.

## Font Families

### Default Stack

```css
:root {
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

### Approved Font Options

Tenants can choose from these pre-approved fonts:

| Font | Style | Usage |
|------|-------|-------|
| **Inter** | Clean, modern | Default, all-purpose |
| **System** | Native OS fonts | Performance-focused |
| **Plus Jakarta Sans** | Friendly, rounded | Approachable brands |
| **DM Sans** | Geometric, clean | Tech-forward brands |

> Custom fonts can be added per tenant request with performance review.

## Type Scale

Based on a 1.25 ratio (Major Third):

| Class | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-xs` | 12px / 0.75rem | 1.5 | 400 | Labels, captions, badges |
| `text-sm` | 14px / 0.875rem | 1.5 | 400 | Secondary text, metadata |
| `text-base` | 16px / 1rem | 1.5 | 400 | Body text (default) |
| `text-lg` | 18px / 1.125rem | 1.5 | 500 | Emphasized body, lead text |
| `text-xl` | 20px / 1.25rem | 1.4 | 600 | Card titles, small headings |
| `text-2xl` | 24px / 1.5rem | 1.3 | 600 | Section headings |
| `text-3xl` | 30px / 1.875rem | 1.2 | 700 | Page titles |
| `text-4xl` | 36px / 2.25rem | 1.2 | 700 | Hero headings |

## Semantic Typography Classes

### Headings

```jsx
<h1 className="text-3xl font-bold text-primary tracking-tight">
  Page Title
</h1>

<h2 className="text-2xl font-semibold text-primary">
  Section Heading
</h2>

<h3 className="text-xl font-semibold text-primary">
  Subsection Heading
</h3>

<h4 className="text-lg font-medium text-primary">
  Card Title
</h4>
```

### Body Text

```jsx
<p className="text-base text-secondary leading-relaxed">
  Body text for paragraphs and descriptions.
</p>

<p className="text-sm text-muted">
  Secondary information, metadata, timestamps.
</p>

<span className="text-xs text-muted uppercase tracking-wide">
  Label Text
</span>
```

### Special Text Styles

```jsx
{/* Lead paragraph */}
<p className="text-lg text-secondary leading-relaxed">
  Introductory text that sets context.
</p>

{/* Code/technical */}
<code className="font-mono text-sm bg-surface px-1.5 py-0.5 rounded">
  technical_value
</code>

{/* Links */}
<a className="text-primary hover:text-primary-700 underline-offset-2 hover:underline">
  Link text
</a>
```

## Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text, descriptions |
| Medium | 500 | Emphasized text, labels |
| Semibold | 600 | Headings, buttons |
| Bold | 700 | Page titles, strong emphasis |

## Line Heights

| Class | Value | Usage |
|-------|-------|-------|
| `leading-none` | 1 | Single-line text, badges |
| `leading-tight` | 1.25 | Headings |
| `leading-snug` | 1.375 | Compact lists |
| `leading-normal` | 1.5 | Body text (default) |
| `leading-relaxed` | 1.625 | Long-form content |

## Letter Spacing

| Class | Value | Usage |
|-------|-------|-------|
| `tracking-tighter` | -0.05em | Large display text |
| `tracking-tight` | -0.025em | Headings |
| `tracking-normal` | 0 | Body text |
| `tracking-wide` | 0.025em | Uppercase labels |
| `tracking-wider` | 0.05em | Small uppercase text |

## Responsive Typography

Scale down on mobile for better readability:

```jsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>

<p className="text-sm md:text-base">
  Body text that adjusts on larger screens.
</p>
```

## Component Typography Patterns

### Cards

```jsx
<div className="card">
  <span className="text-xs text-muted uppercase tracking-wide">
    Category
  </span>
  <h3 className="text-lg font-semibold text-primary mt-1">
    Card Title
  </h3>
  <p className="text-sm text-secondary mt-2">
    Card description text goes here.
  </p>
</div>
```

### Forms

```jsx
<label className="text-sm font-medium text-primary">
  Field Label
</label>
<input className="text-base text-primary placeholder:text-muted" />
<p className="text-xs text-muted mt-1">
  Helper text for the field.
</p>
<p className="text-xs text-error mt-1">
  Error message if validation fails.
</p>
```

### Navigation

```jsx
<nav>
  <a className="text-sm font-medium text-secondary hover:text-primary">
    Nav Item
  </a>
  <a className="text-sm font-medium text-primary">
    Active Nav Item
  </a>
</nav>
```

### Data Display

```jsx
<div className="stat">
  <span className="text-xs text-muted uppercase tracking-wide">
    Total Progress
  </span>
  <span className="text-3xl font-bold text-primary">
    78%
  </span>
</div>
```

## Accessibility

### Minimum Sizes
- Body text: 16px minimum
- Interactive elements: 14px minimum
- Never use text smaller than 12px

### Contrast
- Primary text: 4.5:1 minimum contrast
- Secondary text: 4.5:1 minimum contrast
- Decorative text only: 3:1 minimum

### Scalability
- Use `rem` units for font sizes
- Support browser font size preferences
- Test at 200% zoom level

