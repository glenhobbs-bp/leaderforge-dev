/**
 * File: src/components/layout/app-shell.tsx
 * Purpose: Main application shell with sidebar
 * Owner: Core Team
 */

'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';

interface UserContext {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
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

interface AppShellProps {
  userContext: UserContext;
  children: React.ReactNode;
}

export function AppShell({ userContext, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar
        className="hidden lg:flex w-64 border-r flex-shrink-0"
        userContext={userContext}
      />

      {/* Mobile Sidebar Overlay */}
      <MobileNav
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userContext={userContext}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userContext={userContext}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}

