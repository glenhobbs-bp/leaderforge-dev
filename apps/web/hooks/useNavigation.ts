// File: apps/web/hooks/useNavigation.ts
// Purpose: Database-driven navigation hook that transforms NavOption[] to NavPanelSchema
// Owner: Frontend team
// Tags: React hooks, navigation, database-driven, entitlements, React Query

import { useMemo } from 'react';
import { useNavOptions } from './useNavOptions';
import type { NavOption } from '../app/lib/types';
import type { NavPanelSchema } from '../components/ui/NavPanel';
import { useQuery } from '@tanstack/react-query';

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
export function useNavigation(contextKey: string, userId?: string) {
  const { navOptions, loading, error } = useNavOptions(contextKey);

  // Fetch user data for personalized greeting
  const { data: userData } = useQuery({
    queryKey: ['userData', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch(`/api/user/${userId}/preferences`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const navSchema: NavPanelSchema | null = useMemo(() => {
    if (!navOptions || !Array.isArray(navOptions)) return null;

    // Group nav options by section and collect section orders
    const sectionMap = new Map<string, NavOption[]>();
    const sectionOrders = new Map<string, number>();

    navOptions.forEach((option: NavOption) => {
      const sectionKey = option.section || 'default';

      // Group by section
      if (!sectionMap.has(sectionKey)) {
        sectionMap.set(sectionKey, []);
      }
      sectionMap.get(sectionKey)!.push(option);

      // Track section order (use the first occurrence of section_order for each section)
      if (!sectionOrders.has(sectionKey) && typeof option.section_order === 'number') {
        sectionOrders.set(sectionKey, option.section_order);
      }
    });

    // Sort sections by section_order, then alphabetically for sections without order
    const sortedSectionEntries = Array.from(sectionMap.entries()).sort(([sectionA], [sectionB]) => {
      const orderA = sectionOrders.get(sectionA) ?? 999; // Default high order for unordered sections
      const orderB = sectionOrders.get(sectionB) ?? 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // For same order or both unordered, sort alphabetically (null/default sections go last)
      if (sectionA === 'default') return 1;
      if (sectionB === 'default') return -1;
      return sectionA.localeCompare(sectionB);
    });

    // Convert to NavPanel sections format with proper item ordering
    const sections: NavigationSection[] = sortedSectionEntries.map(([sectionTitle, options]) => {
      // Sort items within each section by their order field
      const sortedOptions = options.sort((a, b) => {
        const orderA = a.order ?? 999; // Default high order for unordered items
        const orderB = b.order ?? 999;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // For same order, sort alphabetically by label
        return a.label.localeCompare(b.label);
      });

      return {
        title: sectionTitle === 'default' ? null : sectionTitle,
        items: sortedOptions.map((option) => ({
          id: option.id, // Use database ID, not nav_key
          label: option.label,
          icon: option.icon,
          href: option.href,
          description: typeof option.description === 'string' ? option.description : undefined,
        }))
      };
    });

    // Add default sign out section at the end
    sections.push({
      title: null,
      items: [{
        id: 'sign-out',
        label: 'Sign Out',
        icon: 'log-out',
        position: 'bottom'
      }]
    });

    // Create personalized greeting
    const firstName = userData?.user?.first_name;
    const greeting = firstName ? `Welcome ${firstName}` : "Welcome back";

    return {
      type: "NavPanel" as const,
      props: {
        header: {
          greeting
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
  }, [navOptions, userData]);

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
    id: option.id, // Use database ID, not nav_key
    label: option.label,
    icon: option.icon,
    href: option.href,
    description: option.description,
    agentId: option.agent_id
  };
}