/**
 * File: src/components/providers/theme-provider.tsx
 * Purpose: Theme provider for light/dark mode support
 * Owner: Core Team
 */

'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

