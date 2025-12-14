/**
 * File: src/components/layout/sidebar.tsx
 * Purpose: Desktop sidebar navigation
 * Owner: Core Team
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  BookOpen,
  TrendingUp,
  Trophy,
  Settings,
  Users,
  Building,
  ScrollText,
} from 'lucide-react';

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

interface SidebarProps {
  className?: string;
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

export function Sidebar({ className, userContext }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = ['admin', 'owner'].includes(userContext.role);

  return (
    <nav className={cn('flex flex-col bg-sidebar', className)}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold text-sidebar-primary">
            {userContext.tenant?.displayName || 'LeaderForge'}
          </span>
        </Link>
      </div>

      {/* Organization Name */}
      {userContext.organization && (
        <div className="px-6 py-3 border-b border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/60 uppercase tracking-wider">
            Organization
          </p>
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {userContext.organization.name}
          </p>
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex-1 py-4 overflow-y-auto">
        <NavSection title="Menu" items={mainNavigation} pathname={pathname} />

        {isAdmin && (
          <NavSection
            title="Admin"
            items={adminNavigation}
            pathname={pathname}
          />
        )}
      </div>

      {/* Settings */}
      <div className="border-t border-sidebar-border p-4">
        <NavItem
          item={{ name: 'Settings', href: '/settings', icon: Settings }}
          isActive={pathname.startsWith('/settings')}
        />
      </div>
    </nav>
  );
}

interface NavSectionProps {
  title: string;
  items: Array<{ name: string; href: string; icon: React.ComponentType<{ className?: string }> }>;
  pathname: string;
}

function NavSection({ title, items, pathname }: NavSectionProps) {
  return (
    <div className="px-3 mb-4">
      <h3 className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
        {title}
      </h3>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.href}>
            <NavItem
              item={item}
              isActive={
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href)
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface NavItemProps {
  item: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  isActive: boolean;
}

function NavItem({ item, isActive }: NavItemProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.name}
    </Link>
  );
}

