/**
 * File: packages/ui/src/types.ts
 * Purpose: Shared UI types
 * Owner: Core Team
 */

import type { VariantProps } from 'class-variance-authority';

// Button types placeholder
export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

