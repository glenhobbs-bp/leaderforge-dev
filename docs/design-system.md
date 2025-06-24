# LeaderForge Design System

**Version:** 1.0.0
**Last Updated:** June 22, 2025
**Owner:** Frontend Team
**Tags:** Design System, UI/UX, Branding, Components

## Table of Contents

1. [Foundation](#foundation)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Library](#component-library)
6. [Animation & Effects](#animation--effects)
7. [Iconography](#iconography)
8. [Context Branding](#context-branding)
9. [Implementation Guidelines](#implementation-guidelines)

---

## Foundation

### Core Principles

1. **Agent-Native Design** - All components support dynamic theming and schema-driven rendering
2. **Context Awareness** - Components adapt to the active context (LeaderForge, Brilliant, etc.)
3. **Accessibility First** - WCAG 2.1 AA compliance across all components
4. **Performance Optimized** - Minimal bundle size, efficient animations
5. **Mobile-First** - Responsive design starting from 320px width

### Design Tokens Structure

```typescript
interface DesignTokens {
  colors: ColorPalette;
  typography: TypographyScale;
  spacing: SpacingScale;
  shadows: ShadowScale;
  borders: BorderScale;
  animations: AnimationTokens;
}
```

---

## Color System

### Base Color Palette

#### Neutral Colors
```css
:root {
  /* Grays */
  --gray-50: #fafafa;
  --gray-100: #f4f4f5;
  --gray-200: #e4e4e7;
  --gray-300: #d4d4d8;
  --gray-400: #a1a1aa;
  --gray-500: #71717a;
  --gray-600: #52525b;
  --gray-700: #3f3f46;
  --gray-800: #27272a;
  --gray-900: #18181b;
  --gray-950: #09090b;

  /* Pure Colors */
  --white: #ffffff;
  --black: #000000;
}
```

#### Semantic Colors
```css
:root {
  /* Success */
  --success-50: #f0fdf4;
  --success-500: #22c55e;
  --success-600: #16a34a;
  --success-700: #15803d;

  /* Warning */
  --warning-50: #fffbeb;
  --warning-500: #f59e0b;
  --warning-600: #d97706;
  --warning-700: #b45309;

  /* Error */
  --error-50: #fef2f2;
  --error-500: #ef4444;
  --error-600: #dc2626;
  --error-700: #b91c1c;

  /* Info */
  --info-50: #eff6ff;
  --info-500: #3b82f6;
  --info-600: #2563eb;
  --info-700: #1d4ed8;
}
```

### Context-Specific Color Variables

#### LeaderForge Theme
```css
.context-leaderforge {
  --primary: #1e40af;        /* Professional Blue */
  --primary-hover: #1d4ed8;
  --primary-light: #dbeafe;
  --secondary: #059669;      /* Success Green */
  --accent: #dc2626;         /* Action Red */
  --background: #ffffff;
  --surface: #f8fafc;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border: #e2e8f0;
  --gradient: linear-gradient(135deg, #1e40af 0%, #059669 50%, #dc2626 100%);
}
```

#### Brilliant Movement Theme
```css
.context-brilliant {
  --primary: #3e5e17;        /* Earth Green */
  --primary-hover: #4d7c1f;
  --primary-light: #f0f7e8;
  --secondary: #74a78e;      /* Sage Green */
  --accent: #dd8d00;         /* Golden Yellow */
  --background: #f8f4f1;     /* Warm White */
  --surface: #ffffff;
  --text-primary: #222222;
  --text-secondary: #666666;
  --border: #e3ddc9;
  --gradient: linear-gradient(135deg, #74a78e 0%, #dd8d00 50%, #3e5e17 100%);
}
```

---

## Typography

### Font Families

#### Primary Font Stack
```css
:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  --font-display: 'Cal Sans', 'Inter', sans-serif; /* For headings */
}
```

### Typography Scale

#### Font Sizes
```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */
  --text-6xl: 3.75rem;    /* 60px */
  --text-7xl: 4.5rem;     /* 72px */

  /* Line Heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  /* Font Weights */
  --font-thin: 100;
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  --font-black: 900;
}
```

### Typography Components

#### Headings
```css
.heading-1 {
  font-family: var(--font-display);
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: -0.025em;
  color: var(--text-primary);
}

.heading-2 {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  letter-spacing: -0.025em;
  color: var(--text-primary);
}

.heading-3 {
  font-family: var(--font-primary);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  color: var(--text-primary);
}

.heading-4 {
  font-family: var(--font-primary);
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  line-height: var(--leading-snug);
  color: var(--text-primary);
}
```

#### Body Text
```css
.body-large {
  font-family: var(--font-primary);
  font-size: var(--text-lg);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed);
  color: var(--text-primary);
}

.body-base {
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--text-primary);
}

.body-small {
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

.caption {
  font-family: var(--font-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## Spacing & Layout

### Spacing Scale

```css
:root {
  /* Spacing Scale (based on 4px grid) */
  --space-0: 0;
  --space-px: 1px;
  --space-0-5: 0.125rem;  /* 2px */
  --space-1: 0.25rem;     /* 4px */
  --space-1-5: 0.375rem;  /* 6px */
  --space-2: 0.5rem;      /* 8px */
  --space-2-5: 0.625rem;  /* 10px */
  --space-3: 0.75rem;     /* 12px */
  --space-3-5: 0.875rem;  /* 14px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-7: 1.75rem;     /* 28px */
  --space-8: 2rem;        /* 32px */
  --space-9: 2.25rem;     /* 36px */
  --space-10: 2.5rem;     /* 40px */
  --space-11: 2.75rem;    /* 44px */
  --space-12: 3rem;       /* 48px */
  --space-14: 3.5rem;     /* 56px */
  --space-16: 4rem;       /* 64px */
  --space-20: 5rem;       /* 80px */
  --space-24: 6rem;       /* 96px */
  --space-28: 7rem;       /* 112px */
  --space-32: 8rem;       /* 128px */
}
```

### Layout Tokens

```css
:root {
  /* Container Widths */
  --container-xs: 20rem;     /* 320px */
  --container-sm: 24rem;     /* 384px */
  --container-md: 28rem;     /* 448px */
  --container-lg: 32rem;     /* 512px */
  --container-xl: 36rem;     /* 576px */
  --container-2xl: 42rem;    /* 672px */
  --container-3xl: 48rem;    /* 768px */
  --container-4xl: 56rem;    /* 896px */
  --container-5xl: 64rem;    /* 1024px */
  --container-6xl: 72rem;    /* 1152px */
  --container-7xl: 80rem;    /* 1280px */

  /* Breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;

  /* Z-Index Scale */
  --z-0: 0;
  --z-10: 10;
  --z-20: 20;
  --z-30: 30;
  --z-40: 40;
  --z-50: 50;
  --z-auto: auto;
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-offcanvas: 1050;
  --z-modal: 1060;
  --z-popover: 1070;
  --z-tooltip: 1080;
}
```

### Border & Shadow Tokens

```css
:root {
  /* Border Radius */
  --radius-none: 0;
  --radius-sm: 0.125rem;     /* 2px */
  --radius-base: 0.25rem;    /* 4px */
  --radius-md: 0.375rem;     /* 6px */
  --radius-lg: 0.5rem;       /* 8px */
  --radius-xl: 0.75rem;      /* 12px */
  --radius-2xl: 1rem;        /* 16px */
  --radius-3xl: 1.5rem;      /* 24px */
  --radius-full: 9999px;

  /* Border Widths */
  --border-0: 0;
  --border: 1px;
  --border-2: 2px;
  --border-4: 4px;
  --border-8: 8px;

  /* Shadows */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-base: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-md: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  --shadow-2xl: 0 50px 100px -20px rgb(0 0 0 / 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
}
```

---

## Component Library

### Button Components

#### Base Button Styles
```css
.btn {
  /* Base button styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-none);
  border: var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  white-space: nowrap;
  user-select: none;

  /* Focus styles */
  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  /* Disabled styles */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}

/* Button Variants */
.btn-primary {
  background-color: var(--primary);
  border-color: var(--primary);
  color: var(--white);

  &:hover {
    background-color: var(--primary-hover);
    border-color: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
}

.btn-secondary {
  background-color: transparent;
  border-color: var(--border);
  color: var(--text-primary);

  &:hover {
    background-color: var(--surface);
    border-color: var(--primary);
    color: var(--primary);
  }
}

.btn-ghost {
  background-color: transparent;
  border-color: transparent;
  color: var(--text-primary);

  &:hover {
    background-color: var(--surface);
    color: var(--primary);
  }
}

/* Button Sizes */
.btn-sm {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-xs);
}

.btn-lg {
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-base);
}

.btn-xl {
  padding: var(--space-5) var(--space-10);
  font-size: var(--text-lg);
}
```

### Card Components

```css
.card {
  background-color: var(--surface);
  border: var(--border) solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all 0.2s ease-in-out;

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
}

.card-header {
  padding: var(--space-6);
  border-bottom: var(--border) solid var(--border);
}

.card-body {
  padding: var(--space-6);
}

.card-footer {
  padding: var(--space-6);
  border-top: var(--border) solid var(--border);
  background-color: var(--background);
}

/* Card Variants */
.card-elevated {
  box-shadow: var(--shadow-lg);
  border: none;
}

.card-interactive {
  cursor: pointer;

  &:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px);
  }
}
```

### Input Components

```css
.input {
  display: block;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  background-color: var(--background);
  border: var(--border) solid var(--border);
  border-radius: var(--radius-lg);
  transition: all 0.2s ease-in-out;

  &::placeholder {
    color: var(--text-secondary);
  }

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  &:invalid {
    border-color: var(--error-500);

    &:focus {
      box-shadow: 0 0 0 3px var(--error-50);
    }
  }
}

.input-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.input-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.input-error {
  font-size: var(--text-xs);
  color: var(--error-500);
}
```

### Navigation Components

```css
.nav-panel {
  background-color: var(--surface);
  border-right: var(--border) solid var(--border);
  height: 100vh;
  overflow-y: auto;
  transition: all 0.3s ease-in-out;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-lg);
  margin: var(--space-1) var(--space-2);
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: var(--primary-light);
    color: var(--primary);
  }

  &.active {
    background-color: var(--primary);
    color: var(--white);
    font-weight: var(--font-medium);
  }
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.nav-section {
  padding: var(--space-4) var(--space-2);

  .nav-section-title {
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--space-2);
    padding: 0 var(--space-2);
  }
}
```

---

## Animation & Effects

### Animation Tokens

```css
:root {
  /* Duration */
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;

  /* Easing */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

### Loading Animations

```css
/* Spinner Animation */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  animation: spin var(--duration-slow) var(--ease-linear) infinite;
}

/* Pulse Animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse var(--duration-slow) var(--ease-in-out) infinite;
}

/* Fade In Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(var(--space-4));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}

/* Slide In Animation */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(var(--space-8));
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.slide-in-right {
  animation: slideInRight var(--duration-normal) var(--ease-out);
}
```

### Loading States

```css
.loading-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  backdrop-filter: blur(4px);
}

.loading-content {
  background-color: var(--surface);
  border-radius: var(--radius-2xl);
  padding: var(--space-8);
  text-align: center;
  box-shadow: var(--shadow-2xl);
  max-width: var(--container-sm);
  margin: var(--space-4);
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid var(--primary-light);
  border-top: 4px solid var(--primary);
  border-radius: var(--radius-full);
  margin: 0 auto var(--space-4);
  animation: spin var(--duration-slow) var(--ease-linear) infinite;
}
```

---

## Iconography

### Icon System

#### Icon Sizes
```css
:root {
  --icon-xs: 0.75rem;    /* 12px */
  --icon-sm: 1rem;       /* 16px */
  --icon-base: 1.25rem;  /* 20px */
  --icon-lg: 1.5rem;     /* 24px */
  --icon-xl: 2rem;       /* 32px */
  --icon-2xl: 2.5rem;    /* 40px */
  --icon-3xl: 3rem;      /* 48px */
}
```

#### Icon Components
```css
.icon {
  display: inline-block;
  width: var(--icon-base);
  height: var(--icon-base);
  fill: currentColor;
  flex-shrink: 0;
}

.icon-xs { width: var(--icon-xs); height: var(--icon-xs); }
.icon-sm { width: var(--icon-sm); height: var(--icon-sm); }
.icon-lg { width: var(--icon-lg); height: var(--icon-lg); }
.icon-xl { width: var(--icon-xl); height: var(--icon-xl); }
.icon-2xl { width: var(--icon-2xl); height: var(--icon-2xl); }
.icon-3xl { width: var(--icon-3xl); height: var(--icon-3xl); }
```

### Icon Usage Guidelines

1. **Use Lucide React icons** for consistency
2. **Size appropriately** - icons should be readable at their intended size
3. **Maintain color contrast** - ensure icons meet accessibility standards
4. **Use semantic meaning** - icons should reinforce the action or content they represent

---

## Context Branding

### LeaderForge Context

#### Brand Colors
```css
.context-leaderforge {
  --primary: #1e40af;        /* Professional Blue */
  --primary-hover: #1d4ed8;
  --primary-light: #dbeafe;
  --secondary: #059669;      /* Success Green */
  --accent: #dc2626;         /* Action Red */
  --background: #ffffff;
  --surface: #f8fafc;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border: #e2e8f0;
  --gradient: linear-gradient(135deg, #1e40af 0%, #059669 50%, #dc2626 100%);
}
```

#### Brand Personality
- **Professional** - Clean, authoritative, trustworthy
- **Growth-Oriented** - Forward-thinking, progressive
- **Empowering** - Confident, enabling, supportive
- **Modern** - Contemporary, innovative, efficient

#### Typography Hierarchy
- **Headlines**: Cal Sans (display font)
- **Body Text**: Inter (primary font)
- **Code**: JetBrains Mono

### Brilliant Movement Context

#### Brand Colors
```css
.context-brilliant {
  --primary: #3e5e17;        /* Earth Green */
  --primary-hover: #4d7c1f;
  --primary-light: #f0f7e8;
  --secondary: #74a78e;      /* Sage Green */
  --accent: #dd8d00;         /* Golden Yellow */
  --background: #f8f4f1;     /* Warm White */
  --surface: #ffffff;
  --text-primary: #222222;
  --text-secondary: #666666;
  --border: #e3ddc9;
  --gradient: linear-gradient(135deg, #74a78e 0%, #dd8d00 50%, #3e5e17 100%);
}
```

#### Brand Personality
- **Authentic** - Genuine, real, honest
- **Community-Focused** - Collaborative, inclusive, supportive
- **Spiritual** - Meaningful, purposeful, transformative
- **Warm** - Welcoming, nurturing, caring

#### Visual Elements
- **Organic shapes** and rounded corners
- **Earth tones** and natural colors
- **Soft shadows** and gentle transitions
- **Hand-crafted feel** with subtle imperfections

---

## Implementation Guidelines

### CSS Custom Properties Usage

#### Setting Context Theme
```typescript
// React component example
export function ContextProvider({ context, children }: ContextProviderProps) {
  const contextClass = `context-${context}`;

  return (
    <div className={contextClass}>
      {children}
    </div>
  );
}
```

#### Dynamic Theme Switching
```typescript
// Theme switching utility
export function switchContext(context: 'leaderforge' | 'brilliant') {
  document.documentElement.className = `context-${context}`;
}
```

### Component Implementation

#### Using Design Tokens
```tsx
// Button component example
export function Button({
  variant = 'primary',
  size = 'base',
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    'btn',
    `btn-${variant}`,
    size !== 'base' && `btn-${size}`
  );

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
```

#### Responsive Design
```css
/* Mobile-first responsive design */
.component {
  /* Mobile styles (default) */
  padding: var(--space-4);

  /* Tablet and up */
  @media (min-width: 768px) {
    padding: var(--space-6);
  }

  /* Desktop and up */
  @media (min-width: 1024px) {
    padding: var(--space-8);
  }
}
```

### Accessibility Guidelines

1. **Color Contrast**: Maintain 4.5:1 ratio for normal text, 3:1 for large text
2. **Focus States**: All interactive elements must have visible focus indicators
3. **Semantic HTML**: Use proper HTML elements and ARIA attributes
4. **Keyboard Navigation**: All functionality accessible via keyboard
5. **Screen Readers**: Provide alt text and ARIA labels where needed

### Performance Considerations

1. **CSS Variables**: Use for dynamic theming without JavaScript
2. **Minimal Animations**: Respect `prefers-reduced-motion`
3. **Efficient Selectors**: Avoid deep nesting and complex selectors
4. **Bundle Optimization**: Tree-shake unused styles
5. **Critical CSS**: Inline critical styles for above-the-fold content

---

## Development Workflow

### Adding New Components

1. **Design First**: Create component design in Figma
2. **Token Definition**: Define any new design tokens needed
3. **Component Creation**: Build component following patterns
4. **Documentation**: Add component to Storybook
5. **Testing**: Ensure accessibility and cross-browser compatibility

### Design Token Updates

1. **Centralized Changes**: Update tokens in design system file
2. **Context Awareness**: Ensure changes work across all contexts
3. **Backward Compatibility**: Consider impact on existing components
4. **Documentation**: Update design system documentation

This design system ensures consistency, maintainability, and scalability across the LeaderForge platform while supporting multiple contexts and maintaining high accessibility standards.