/**
 * File: src/components/layout/mobile-nav.tsx
 * Purpose: Mobile navigation sidebar
 * Owner: Core Team
 */

'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { X, Home, BookOpen, TrendingUp, Trophy, Settings, Users, Building, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserContext {
  role: string;
  tenant: {
    tenantKey: string;
    displayName: string;
  } | null;
  organization: {
    id: string;
    name: string;
  } | null;
}

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  userContext: UserContext;
}

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Content', href: '/content', icon: BookOpen },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
];

const adminNavigation = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Teams', href: '/admin/teams', icon: Users },
  { name: 'Organization', href: '/admin/organization', icon: Building },
  { name: 'Audit Log', href: '/admin/audit', icon: ScrollText },
];

export function MobileNav({ open, onClose, userContext }: MobileNavProps) {
  const pathname = usePathname();
  const isAdmin = ['admin', 'owner'].includes(userContext.role);

  if (!open) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-sidebar z-50 lg:hidden animate-slide-in-from-left">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-sm">
              {(userContext.tenant?.displayName || 'LF').slice(0, 2).toUpperCase()}
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">
              {userContext.tenant?.displayName || 'LeaderForge'}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Organization */}
        {userContext.organization && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/60 uppercase tracking-wider">
              Organization
            </p>
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {userContext.organization.name}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 mb-4">
            <h3 className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              Menu
            </h3>
            <ul className="space-y-1">
              {mainNavigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      pathname.startsWith(item.href)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {isAdmin && (
            <div className="px-3 mb-4">
              <h3 className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                Admin
              </h3>
              <ul className="space-y-1">
                {adminNavigation.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        pathname.startsWith(item.href)
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* Settings */}
        <div className="border-t border-sidebar-border p-4">
          <Link
            href="/settings"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith('/settings')
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>
    </Fragment>
  );
}

