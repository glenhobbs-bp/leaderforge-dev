/**
 * File: src/components/providers/tenant-theme-provider.tsx
 * Purpose: Applies tenant-specific CSS variables for theming
 * Owner: Core Team
 */

'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { generateThemeCSS, type TenantTheme, type OrgBranding } from '@/lib/theme';

interface TenantThemeContextValue {
  tenantKey: string;
  tenantName: string;
  theme: TenantTheme | null;
  orgBranding: OrgBranding | null;
}

const TenantThemeContext = createContext<TenantThemeContextValue | null>(null);

interface TenantThemeProviderProps {
  children: ReactNode;
  tenantKey: string;
  tenantName: string;
  theme: TenantTheme | null;
  orgBranding?: OrgBranding | null;
}

export function TenantThemeProvider({
  children,
  tenantKey,
  tenantName,
  theme,
  orgBranding = null,
}: TenantThemeProviderProps) {
  // Apply theme CSS variables
  useEffect(() => {
    if (!theme) return;

    const css = generateThemeCSS(theme, orgBranding);
    if (!css) return;

    // Create or update style element
    const styleId = 'tenant-theme';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `:root {\n    ${css}\n  }`;

    // Cleanup on unmount
    return () => {
      styleEl?.remove();
    };
  }, [theme, orgBranding]);

  // Update favicon if tenant has one
  useEffect(() => {
    if (theme?.favicon_url) {
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (link) {
        link.href = theme.favicon_url;
      }
    }
  }, [theme?.favicon_url]);

  return (
    <TenantThemeContext.Provider
      value={{ tenantKey, tenantName, theme, orgBranding }}
    >
      {children}
    </TenantThemeContext.Provider>
  );
}

export function useTenantTheme() {
  const context = useContext(TenantThemeContext);
  if (!context) {
    throw new Error('useTenantTheme must be used within a TenantThemeProvider');
  }
  return context;
}

