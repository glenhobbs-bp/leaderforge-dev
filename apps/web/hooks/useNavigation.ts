// File: apps/web/hooks/useNavigation.ts
// Purpose: Database-driven navigation hook that transforms NavOption[] to NavPanelSchema
// Replaces arbitrary navSchema props with entitlement-based database queries

import { useMemo } from 'react';
import { useNavOptions } from './useNavOptions';
import type { NavOption } from '../app/lib/types';
import type { NavPanelSchema } from '../components/ui/NavPanel';

interface NavigationSection {
  title?: string | null;
  items: Array<{
    id: string;
    label: string;
    icon?: string;
    href?: string;
    description?: string;
    position?: "bottom";
  }>;
}

/**
 * Database-driven navigation hook
 * Fetches entitled navigation options from database and transforms to NavPanel schema
 */
export function useNavigation(contextKey: string) {
  const { navOptions, loading, error } = useNavOptions(contextKey);

  const navSchema: NavPanelSchema | null = useMemo(() => {
    if (!navOptions || !Array.isArray(navOptions)) return null;

    // Group nav options by section
    const sectionMap = new Map<string, NavOption[]>();

    navOptions.forEach((option: NavOption) => {
      const sectionKey = option.section || 'default';
      if (!sectionMap.has(sectionKey)) {
        sectionMap.set(sectionKey, []);
      }
      sectionMap.get(sectionKey)!.push(option);
    });

    // Convert to NavPanel sections format
    const sections: NavigationSection[] = Array.from(sectionMap.entries())
      .map(([sectionTitle, options]) => ({
        title: sectionTitle === 'default' ? null : sectionTitle,
        items: options.map((option) => ({
          id: option.nav_key,
          label: option.label,
          icon: option.icon,
          href: option.href,
          description: option.section, // Could be used for tooltips
        }))
      }))
      .sort((a, b) => {
        // Sort sections - null title (default) sections go last
        if (a.title === null) return 1;
        if (b.title === null) return -1;
        return a.title.localeCompare(b.title);
      });

    // Add default sign out section
    sections.push({
      title: null,
      items: [{
        id: 'sign-out',
        label: 'Sign Out',
        icon: 'log-out',
        position: 'bottom'
      }]
    });

    return {
      type: "NavPanel" as const,
      props: {
        header: {
          greeting: "Welcome back"
        },
        sections,
        footer: {
          actions: [{
            label: 'Sign Out',
            action: 'signOut',
            icon: 'log-out'
          }]
        }
      }
    };
  }, [navOptions]);

  return {
    navSchema,
    loading,
    error,
    // Expose raw nav options for debugging
    rawNavOptions: navOptions
  };
}

/**
 * Utility to transform individual NavOption to navigation item
 */
export function transformNavOption(option: NavOption) {
  return {
    id: option.nav_key,
    label: option.label,
    icon: option.icon,
    href: option.href,
    description: option.section,
    agentId: option.agent_id
  };
}