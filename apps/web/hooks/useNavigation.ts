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
export function useNavigation(tenantKey: string, userId?: string) {
  const { navOptions, loading, error } = useNavOptions(tenantKey);

  // Fetch user data for personalized greeting (with aggressive timeout)
  const { data: userData } = useQuery({
    queryKey: ['user-navigation-data', userId],
    queryFn: async () => {
      if (!userId) return null;

      // 5-second timeout to prevent 1+ minute hangs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`/api/user/${userId}/profile`, {
          credentials: 'include',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) return null;
        const result = await response.json();
        return result.user;
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn('[useNavigation] Profile fetch failed:', error);
        return null; // Graceful degradation
      }
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes - longer cache
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    retry: false, // Don't retry on timeout to prevent cascading delays
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
  });

  const navSchema: NavPanelSchema | null = useMemo(() => {
    if (!navOptions || !Array.isArray(navOptions)) return null;

    // Early return if no navigation options to process
    if (navOptions.length === 0) return null;

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

      const sectionItems = sortedOptions.map((option) => {
        // Use database UUID as primary identifier for API calls
        // nav_key is for human readability and debugging only
        const itemId = option.id; // Always use database UUID

        // Debug: Log ID mapping for troubleshooting (only once per component mount)
        // Removed excessive logging that was causing performance issues

        return {
          id: itemId, // Always use database UUID for navigation selection
          label: option.label,
          icon: option.icon,
          href: option.href,
          description: typeof option.description === 'string' ? option.description : undefined,
          nav_key: option.nav_key, // Add nav_key for debugging and display purposes
        };
      });

      return {
        title: sectionTitle === 'default' ? null : sectionTitle,
        items: sectionItems
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

    // Create personalized greeting with fallback
    const firstName = userData?.first_name;
    const greeting = firstName ? `Welcome ${firstName}` : "Welcome";

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
  }, [navOptions, userData?.first_name]); // Only depend on specific userData fields

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
    id: option.id, // Always use database UUID for navigation selection
    label: option.label,
    icon: option.icon,
    href: option.href,
    description: option.description,
    agentId: option.agent_id,
    nav_key: option.nav_key // Add nav_key for debugging and display purposes
  };
}