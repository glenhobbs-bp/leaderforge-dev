/**
 * File: src/app/(dashboard)/settings/layout.tsx
 * Purpose: Settings section layout with navigation
 * Owner: Core Team
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, User, Bell, Shield, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsNav = [
  { name: 'Profile', href: '/settings/profile', icon: User },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell, disabled: true },
  { name: 'Appearance', href: '/settings/appearance', icon: Palette, disabled: true },
  { name: 'Security', href: '/settings/security', icon: Shield, disabled: true },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <nav className="w-full md:w-48 space-y-1">
          {settingsNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.disabled ? '#' : item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : item.disabled
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={(e) => item.disabled && e.preventDefault()}
              >
                <Icon className="h-4 w-4" />
                {item.name}
                {item.disabled && (
                  <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Soon</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
