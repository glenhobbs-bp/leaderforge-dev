/**
 * File: src/components/layout/tenant-logo.tsx
 * Purpose: Tenant logo with fallback to text
 * Owner: Core Team
 */

'use client';

import Image from 'next/image';
import { useTenantTheme } from '@/components/providers/tenant-theme-provider';
import { getLogoUrl, getDisplayName } from '@/lib/theme';

interface TenantLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { width: 24, height: 24, textClass: 'text-lg' },
  md: { width: 32, height: 32, textClass: 'text-xl' },
  lg: { width: 48, height: 48, textClass: 'text-2xl' },
};

export function TenantLogo({ className, size = 'md' }: TenantLogoProps) {
  const { tenantName, theme, orgBranding } = useTenantTheme();
  const logoUrl = getLogoUrl(theme, orgBranding);
  const displayName = getDisplayName(tenantName, orgBranding);
  const { width, height, textClass } = sizes[size];

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={displayName}
        width={width}
        height={height}
        className={className}
        priority
      />
    );
  }

  // Fallback to text logo
  return (
    <span className={`font-bold text-sidebar-primary ${textClass} ${className}`}>
      {displayName}
    </span>
  );
}

