/**
 * File: src/components/layout/sidebar.tsx
 * Purpose: Desktop sidebar navigation
 * Owner: Core Team
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTenantTheme } from '@/components/providers/tenant-theme-provider';
import {
  Home,
  BookOpen,
  TrendingUp,
  Trophy,
  Settings,
  Users,
  Building,
  Building2,
  ScrollText,
  Handshake,
  Shield,
  BarChart3,
  Route,
  Library,
  CreditCard,
} from 'lucide-react';

interface UserContext {
  role: string;
  isTeamLeader?: boolean;
  isPlatformAdmin?: boolean;
  isTenantAdmin?: boolean;
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

const leaderNavigation = [
  { name: 'My Team', href: '/team', icon: Handshake },
];

const adminNavigation = [
  { name: 'Org Progress', href: '/admin/progress', icon: BarChart3 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Teams', href: '/admin/teams', icon: Users },
  { name: 'Organization', href: '/admin/organization', icon: Building },
  { name: 'Learning Path', href: '/admin/learning-path', icon: Route },
  { name: 'Audit Log', href: '/admin/audit', icon: ScrollText },
];

const tenantAdminNavigation = [
  { name: 'Organizations', href: '/tenant-admin/organizations', icon: Building2 },
  { name: 'Content Library', href: '/tenant-admin/content', icon: Library },
  { name: 'Tenant Settings', href: '/tenant-admin/settings', icon: Settings },
];

const platformAdminNavigation = [
  { name: 'Overview', href: '/platform-admin', icon: Shield },
  { name: 'Tenants', href: '/platform-admin/tenants', icon: Building2 },
  { name: 'Billing', href: '/platform-admin/billing', icon: CreditCard },
];

export function Sidebar({ className, userContext }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = ['admin', 'owner'].includes(userContext.role);
  const isTeamLeader = userContext.isTeamLeader || isAdmin; // Admins can also see team view
  const isTenantAdmin = userContext.isTenantAdmin || false;
  const isPlatformAdmin = userContext.isPlatformAdmin || false;
  const { theme } = useTenantTheme();

  // Use dark logo for sidebar (navy background needs white text)
  const logoUrl = theme?.logo_dark_url || theme?.logo_url || '/logos/lf_white_text_np.png';

  return (
    <nav className={cn('flex flex-col bg-sidebar', className)}>
      {/* Logo */}
      <div className="h-20 flex items-center px-3 border-b border-sidebar-border">
        <Link href="/dashboard" className="block w-full">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={userContext.tenant?.displayName || 'LeaderForge'}
              className="h-10 w-auto"
            />
          ) : (
            <>
              <div className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center text-white font-bold text-sm">
                {(userContext.tenant?.displayName || 'LF').slice(0, 2).toUpperCase()}
              </div>
              <span className="text-lg font-semibold text-sidebar-foreground">
                {userContext.tenant?.displayName || 'LeaderForge'}
              </span>
            </>
          )}
        </Link>
      </div>

      {/* Organization Name */}
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

      {/* Main Navigation */}
      <div className="flex-1 py-4 overflow-y-auto">
        <NavSection title="Menu" items={mainNavigation} pathname={pathname} />

        {isTeamLeader && (
          <NavSection
            title="Leadership"
            items={leaderNavigation}
            pathname={pathname}
          />
        )}

        {isAdmin && (
          <NavSection
            title="Org Admin"
            items={adminNavigation}
            pathname={pathname}
          />
        )}

        {isTenantAdmin && (
          <NavSection
            title="Tenant Admin"
            items={tenantAdminNavigation}
            pathname={pathname}
          />
        )}

        {isPlatformAdmin && (
          <NavSection
            title="Platform"
            items={platformAdminNavigation}
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
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.name}
    </Link>
  );
}
