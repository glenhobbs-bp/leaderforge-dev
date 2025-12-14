/**
 * File: src/lib/theme.ts
 * Purpose: Theme utilities for multi-tenant theming
 * Owner: Core Team
 */

export interface TenantTheme {
  logo_url: string | null;
  logo_dark_url?: string | null;
  logo_icon_url?: string | null;
  favicon_url: string | null;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text_primary: string;
  text_secondary: string;
  font_family: string;
  border_radius: string;
}

export interface OrgBranding {
  logo_url: string | null;
  primary_color: string | null;
  display_name: string | null;
  use_tenant_theme: boolean;
}

/**
 * Convert hex color to HSL values for CSS variables
 */
export function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Return HSL values without hsl() wrapper for CSS variable usage
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Lighten a hex color by a percentage
 */
function lightenHex(hex: string, percent: number): string {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const newR = Math.min(255, Math.round(r + (255 - r) * percent));
  const newG = Math.min(255, Math.round(g + (255 - g) * percent));
  const newB = Math.min(255, Math.round(b + (255 - b) * percent));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Generate CSS variables from tenant theme
 */
export function generateThemeCSS(
  tenantTheme: TenantTheme | null,
  orgBranding: OrgBranding | null
): string {
  if (!tenantTheme) {
    return ''; // Use default theme
  }

  // Start with tenant theme
  let primary = tenantTheme.primary;
  let logoUrl = tenantTheme.logo_url;

  // Apply org overrides if not using tenant theme
  if (orgBranding && !orgBranding.use_tenant_theme) {
    if (orgBranding.primary_color) {
      primary = orgBranding.primary_color;
    }
    if (orgBranding.logo_url) {
      logoUrl = orgBranding.logo_url;
    }
  }

  // Generate sidebar accent color (lighter version of primary)
  const sidebarAccent = lightenHex(primary, 0.9);

  // Generate CSS variables
  const variables: Record<string, string> = {
    // Core colors
    '--primary': hexToHSL(primary),
    '--primary-foreground': '0 0% 100%', // White text on primary
    '--secondary': hexToHSL(tenantTheme.secondary),
    '--accent': hexToHSL(tenantTheme.accent),
    '--background': hexToHSL(tenantTheme.background),
    '--foreground': hexToHSL(tenantTheme.text_primary),
    '--muted-foreground': hexToHSL(tenantTheme.text_secondary),
    '--card': hexToHSL(tenantTheme.background),
    '--card-foreground': hexToHSL(tenantTheme.text_primary),
    
    // Sidebar - use primary color as sidebar background
    '--sidebar-background': hexToHSL(primary),
    '--sidebar-foreground': '0 0% 100%', // White text
    '--sidebar-primary': hexToHSL(tenantTheme.secondary),
    '--sidebar-primary-foreground': '0 0% 100%',
    '--sidebar-accent': hexToHSL(sidebarAccent),
    '--sidebar-accent-foreground': hexToHSL(primary),
    '--sidebar-border': `${hexToHSL(primary).split(' ')[0]} 50% 40%`, // Slightly lighter border
    
    // Ring/focus color
    '--ring': hexToHSL(tenantTheme.secondary),
    
    // Border radius
    '--radius': tenantTheme.border_radius,
  };

  // Build CSS string
  return Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n    ');
}

/**
 * Get effective logo URL considering org override
 */
export function getLogoUrl(
  tenantTheme: TenantTheme | null,
  orgBranding: OrgBranding | null
): string | null {
  if (orgBranding?.logo_url && !orgBranding.use_tenant_theme) {
    return orgBranding.logo_url;
  }
  return tenantTheme?.logo_url || null;
}

/**
 * Get logo icon URL (for small spaces like sidebar)
 */
export function getLogoIconUrl(
  tenantTheme: TenantTheme | null
): string | null {
  return tenantTheme?.logo_icon_url || tenantTheme?.logo_url || null;
}

/**
 * Get effective display name considering org override
 */
export function getDisplayName(
  tenantName: string,
  orgBranding: OrgBranding | null
): string {
  if (orgBranding?.display_name && !orgBranding.use_tenant_theme) {
    return orgBranding.display_name;
  }
  return tenantName;
}
