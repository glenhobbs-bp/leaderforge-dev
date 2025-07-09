"use client";
// File: apps/web/components/DynamicTenantPage.tsx
// Purpose: Agent-native 3-panel layout. Pure renderer - displays only what agents return.
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from "react";
import ThreePanelLayout from "./ui/ThreePanelLayout";
import NavPanel from "./ui/NavPanel";
import { UniversalSchemaRenderer } from "./ai/UniversalSchemaRenderer";
import { ComponentSchema } from "../../../packages/agent-core/types/ComponentSchema";
import { UniversalWidgetSchema } from "../../../packages/agent-core/types/UniversalWidgetSchema";
// 🚀 PERFORMANCE FIX: Dynamic import VideoPlayerModal to prevent 3.3MB HLS.js bundle bloat
// import { VideoPlayerModal } from "./widgets/VideoPlayerModal"; // ❌ Removed static import
import { FormWidget } from "./forms/FormWidget";
import { useSupabase } from './SupabaseProvider';

// Dynamic VideoPlayerModal loader to prevent bundle bloat
const DynamicVideoPlayerModal = lazy(() =>
  import('./widgets/VideoPlayerModal').then(module => ({
    default: module.VideoPlayerModal
  }))
);
import { useUserPreferences } from '../app/hooks/useUserPreferences';
import type { UserPreferences, TenantConfig } from '../app/lib/types';
import { defaultActionRegistry, initializeDefaultHandlers, type ActionData } from '../app/lib/widgetActionRegistry';

// Diagnostic: Track module load
console.log('[DynamicTenantPage] Module loaded - Database-driven mode');

// Agent schema types - includes mockup support for agent-native mockups
interface AgentSchema {
  type: 'content_schema' | 'no_agent' | 'error' | 'mockup' | 'direct_route' | 'static_page';
  content?: unknown; // ComponentSchema, mockup data, or simple content objects
  message?: string; // For no_agent responses
  metadata?: {
    threadId?: string;
    runId?: string;
    agentId?: string;
    agentName?: string;
    agentType?: string;
    directRoute?: string; // For direct_route responses
  };
}

type DynamicTenantPageProps = {
  // Props for tenant management - using correct TenantConfig type
  initialTenants?: TenantConfig[];
  initialTenantConfig?: unknown;
  initialNavOptions?: unknown;
  defaultTenantKey?: string;
};

export default function DynamicTenantPage(props: DynamicTenantPageProps) {
  // Reduced debug logging to prevent console spam during render loops
  // console.log('[DynamicTenantPage] RENDER - Database-driven', props);

  // Auth context
  const { session, loading: authLoading } = useSupabase();

  // React Query client removed - was causing render loops via cache invalidation

  // Core state - prevent multiple mounts
  const hasMounted = useRef(false);
  const hasNavigationRestored = useRef(false);
  const hasTriggeredUserPrefsFetch = useRef(false);
  const [hasRestoredTenant, setHasRestoredTenant] = useState(false);
  const [shouldFetchUserPrefs, setShouldFetchUserPrefs] = useState(false);

  // Video modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoModalData, setVideoModalData] = useState<{ action: string; label: string; [key: string]: unknown } | null>(null);

  // Worksheet modal state
  const [isWorksheetModalOpen, setIsWorksheetModalOpen] = useState(false);
  const [worksheetModalData, setWorksheetModalData] = useState<{
    contentId: string;
    title: string;
    templateId?: string;
    agentReasoning?: string;
    contentAnalysis?: string;
    [key: string]: unknown
  } | null>(null);
  const [currentTenant, setCurrentTenant] = useState<string>(
    props.defaultTenantKey || props.initialTenants?.[0]?.tenant_key || 'leaderforge'
  );
  const [agentSchema, setAgentSchema] = useState<AgentSchema | null>(null);
  const [loading, setLoading] = useState(false); // ✅ FIX: Start with false, set true only during actual loading
  const [contentLoading, setContentLoading] = useState(false); // New loading state for content
  const [error, setError] = useState<string | null>(null);
  const [selectedNavOptionId, setSelectedNavOptionId] = useState<string | null>(null);

  // Only fetch user preferences when explicitly needed
  const { data: userPrefs, error: userPrefsError, refetch: refetchUserPrefs, isLoading: userPrefsLoading } = useUserPreferences(
    session?.user?.id || '',
    { enabled: shouldFetchUserPrefs && !!session?.user?.id }
  );

  // Debug the enabled condition
  console.log('[DynamicTenantPage] 🔍 USER PREFS HOOK DEBUG:', {
    shouldFetchUserPrefs,
    hasSessionUserId: !!session?.user?.id,
    sessionUserId: session?.user?.id,
    enabled: shouldFetchUserPrefs && !!session?.user?.id,
    isLoading: userPrefsLoading,
    hasData: !!userPrefs,
    hasError: !!userPrefsError
  });

  // Mark component as mounted on initial render
  useEffect(() => {
    console.log('[DynamicTenantPage] 🎯 Component mounting...');
    hasMounted.current = true;
    console.log('[DynamicTenantPage] ✅ Component mounted, hasMounted set to true');

    // Initialize widget action registry with existing handlers
    initializeDefaultHandlers({
      setVideoModalData,
      setIsVideoModalOpen,
      setWorksheetModalData,
      setIsWorksheetModalOpen
    });
  }, []);

  // Trigger user preferences fetch on initial mount when session is available
  useEffect(() => {
    console.log('[DynamicTenantPage] 🔍 USER PREFS TRIGGER DEBUG:', {
      hasSessionUserId: !!session?.user?.id,
      sessionUserId: session?.user?.id,
      hasTriggeredUserPrefsFetch: hasTriggeredUserPrefsFetch.current,
      shouldFetchUserPrefs,
      hasMounted: hasMounted.current,
      willTrigger: session?.user?.id && !hasTriggeredUserPrefsFetch.current && !shouldFetchUserPrefs && hasMounted.current
    });

    if (session?.user?.id && !hasTriggeredUserPrefsFetch.current && !shouldFetchUserPrefs && hasMounted.current) {
      console.log('[DynamicTenantPage] Triggering initial user preferences fetch for session:', session.user.id);
      hasTriggeredUserPrefsFetch.current = true;
      setShouldFetchUserPrefs(true);
    }
  }, [session?.user?.id, shouldFetchUserPrefs]); // ✅ FIX: Added shouldFetchUserPrefs dependency

  // Handle user preferences errors gracefully
  useEffect(() => {
    if (userPrefsError) {
      console.warn('[DynamicTenantPage] User preferences failed to load:', userPrefsError);
      // Don't block the app, just mark restoration as complete to proceed
      if (!hasRestoredTenant) {
        setHasRestoredTenant(true);
      }
    }
  }, [userPrefsError, hasRestoredTenant]);

  // Context restoration effect - restore last visited context
  useEffect(() => {
    // If user preferences failed to load, proceed without restoration
    if (userPrefsError) {
      if (!hasRestoredTenant) {
        console.log('[DynamicTenantPage] Skipping tenant restoration due to user preferences error');
        setHasRestoredTenant(true);
      }
      return;
    }

    // ✅ FIX: Check for actual preference properties (not just object length) to detect real vs placeholder data
    // Placeholder data is {} but real data has properties like theme, navigationState, etc.
    const hasRealUserPrefs = userPrefs && (
      'theme' in userPrefs ||
      'navigationState' in userPrefs ||
      'language' in userPrefs ||
      Object.keys(userPrefs).length > 0
    );

    if (!session?.user?.id || !hasRealUserPrefs || hasRestoredTenant || userPrefsLoading) {
      if (userPrefsLoading) {
        console.log('[DynamicTenantPage] ⏳ Waiting for user preferences to load...');
      }
      if (!hasRealUserPrefs && userPrefs) {
        console.log('[DynamicTenantPage] ⏳ User preferences is empty placeholder, waiting for real data...', {
          userPrefs,
          hasTheme: 'theme' in userPrefs,
          hasNavigationState: 'navigationState' in userPrefs,
          hasLanguage: 'language' in userPrefs,
          objectKeys: Object.keys(userPrefs)
        });
      }
      return;
    }

    // ✅ FIX: Add detailed debugging for user preferences structure
    console.log('[DynamicTenantPage] 🔍 DEBUG: Full userPrefs data:', userPrefs);
    console.log('[DynamicTenantPage] 🔍 DEBUG: User prefs loading state:', { userPrefsLoading, userPrefsError, hasUserPrefs: !!userPrefs });

    // ✅ FIX: userPrefs IS the preferences object (API client extracts it)
    const preferences = userPrefs as UserPreferences;
    const navigationState = preferences?.navigationState;
    const lastTenant = navigationState?.lastTenant;

    console.log('[DynamicTenantPage] 🔍 DEBUG: Navigation state details:', {
      preferences,
      navigationState,
      lastTenant,
      lastNavOption: navigationState?.lastNavOption,
      lastUpdated: navigationState?.lastUpdated
    });

    console.log('[DynamicTenantPage] Tenant restoration:', {
      lastTenant,
      currentTenant,
      hasRestoredTenant
    });

    // ✅ FIXED: Only restore tenant if it's actually different AND not already set
    // Prevent infinite loops when tenant is already correct
    if (lastTenant && lastTenant !== currentTenant && hasRestoredTenant === false) {
      console.log('[DynamicTenantPage] Restoring last tenant:', lastTenant);
      setCurrentTenant(lastTenant);
    } else {
      console.log('[DynamicTenantPage] Tenant restoration skipped:', {
        hasLastTenant: !!lastTenant,
        tenantsDifferent: lastTenant !== currentTenant,
        contextNotRestored: hasRestoredTenant === false,
        reason: !lastTenant ? 'no saved tenant' :
                lastTenant === currentTenant ? 'tenant already correct' : 'context already restored'
      });
    }

    setHasRestoredTenant(true);
  }, [session?.user?.id, userPrefs, userPrefsError, hasRestoredTenant, currentTenant, userPrefsLoading]);

  // Navigation option restoration effect - runs ONLY ONCE after context is restored
  useEffect(() => {
    // ✅ CRITICAL FIX: Early exit if already restored to prevent infinite loops
    if (hasNavigationRestored.current || !hasMounted.current) {
      return;
    }

    console.log('[DynamicTenantPage] 🔄 Navigation restoration effect triggered:', {
      hasSession: !!session?.user?.id,
      hasUserPrefs: !!userPrefs,
      hasUserPrefsError: !!userPrefsError,
      hasRestoredTenant,
      currentTenant,
      userPrefsLoading
    });

    // If user preferences failed to load, skip navigation restoration
    if (userPrefsError) {
      console.log('[DynamicTenantPage] Skipping navigation restoration due to user preferences error');
      hasNavigationRestored.current = true; // Mark as attempted to prevent retry loops
      return;
    }

    // ✅ FIX: Check for actual preference properties (not just object length) to detect real vs placeholder data
    // Placeholder data is {} but real data has properties like theme, navigationState, etc.
    const hasRealUserPrefs = userPrefs && (
      'theme' in userPrefs ||
      'navigationState' in userPrefs ||
      'language' in userPrefs ||
      Object.keys(userPrefs).length > 0
    );

    if (!session?.user?.id || !hasRealUserPrefs || !hasRestoredTenant || userPrefsLoading) {
      if (userPrefsLoading) {
        console.log('[DynamicTenantPage] ⏳ Waiting for user preferences to load for navigation restoration...');
      }
      if (!hasRealUserPrefs && userPrefs) {
        console.log('[DynamicTenantPage] ⏳ User preferences is empty placeholder for navigation, waiting for real data...', {
          userPrefs,
          hasTheme: 'theme' in userPrefs,
          hasNavigationState: 'navigationState' in userPrefs,
          hasLanguage: 'language' in userPrefs,
          objectKeys: Object.keys(userPrefs)
        });
      }
      return;
    }

    // ✅ FIX: userPrefs IS the preferences object (API client extracts it)
    const preferences = userPrefs as UserPreferences;
    const navigationState = preferences?.navigationState;
    const lastTenant = navigationState?.lastTenant;
    const lastNavOption = navigationState?.lastNavOption;

    console.log('[DynamicTenantPage] 📊 Navigation restoration data:', {
      navigationState,
      lastTenant,
      lastNavOption,
      currentTenant,
      shouldRestore: lastNavOption && lastTenant === currentTenant,
      // ✅ DEBUG: Add more detailed debugging
      userPrefsStructure: userPrefs,
      preferencesIsUserPrefs: preferences === userPrefs,
      navigationStateRaw: navigationState
    });

    // Only restore navigation option if we're in the correct tenant and have a saved option
    if (lastNavOption && lastTenant === currentTenant) {
      console.log('[DynamicTenantPage] ✅ RESTORING navigation state:', {
        lastNavOption,
        lastTenant,
        currentTenant,
        timestamp: navigationState?.lastUpdated
      });

      console.log('[DynamicTenantPage] 🔧 Setting selectedNavOptionId to:', lastNavOption);
      setSelectedNavOptionId(lastNavOption);
      hasNavigationRestored.current = true; // Mark as restored

      // Trigger content loading for the restored navigation option
      setTimeout(() => {
        console.log('[DynamicTenantPage] ⏳ Triggering content load for restored nav option:', lastNavOption);
        loadContentForNavOption(lastNavOption, false); // Don't update selection since it's already set
      }, 200); // Small delay to ensure context is fully set
    } else {
      console.log('[DynamicTenantPage] 📋 No navigation state to restore:', {
        hasLastNavOption: !!lastNavOption,
        lastTenant: lastTenant || 'none',
        currentTenant,
        reason: !lastNavOption ? 'no saved navigation' : 'tenant mismatch'
      });
      hasNavigationRestored.current = true; // Mark as attempted even if no restoration
    }
  }, [session?.user?.id, userPrefs, userPrefsError, hasRestoredTenant, currentTenant, userPrefsLoading]);

  // Debug session state
  useEffect(() => {
    console.log('[DynamicTenantPage] Session state:', {
      hasSession: !!session,
      userId: session?.user?.id,
      authLoading,
      loading
    });
  }, [session, authLoading, loading]);

  // Track mounting for debug logging
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (process.env.NODE_ENV === 'development') {
        console.log('[DynamicTenantPage] Component mounted - Database-driven mode');
      }
    }
  }, []);



  // ✅ FIX: Initialize loading state properly
  useEffect(() => {
    if (session && !authLoading && hasRestoredTenant) {
      // All initialization complete, ensure loading is false
      setLoading(false);
    }
  }, [session, authLoading, hasRestoredTenant]);

  // 🤖 AGENT-NATIVE: Handle ComponentSchema from agent - MUST be at top level before any returns
  // Memoize content to prevent object recreation causing video re-mounting
  const content = useMemo(() => {
    return agentSchema?.content as ComponentSchema | { type: string; title?: string; description?: string; action?: string; message?: string } | undefined;
  }, [agentSchema?.content]);

  // Check if it's a ComponentSchema (Grid, Card, etc.) or UniversalWidgetSchema - also memoized
  const isComponentSchema = useMemo(() => {
    return content && typeof content === 'object' && 'type' in content &&
      (content.type === 'Grid' || content.type === 'Card' || 'props' in content);
  }, [content]);

  // Check if it's a UniversalWidgetSchema (PromptContext, etc.)
  const isUniversalWidgetSchema = useMemo(() => {
    return content && typeof content === 'object' && 'type' in content && 'id' in content && 'data' in content && 'config' in content && 'version' in content;
  }, [content]);

  const isWelcomeContent = useMemo(() => {
    return content && typeof content === 'object' && 'type' in content && (content.type === 'welcome' || content.type === 'error');
  }, [content]);

  // Memoize schema type separately to avoid contentComponent dependency on full agentSchema
  const schemaType = useMemo(() => {
    return agentSchema?.type;
  }, [agentSchema?.type]);

  // Create loading content component for content panel - MUST be defined before useMemo
  const createLoadingContent = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <img src="/logos/leaderforge-icon.png" alt="LeaderForge Icon" width={40} height={40} />
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4f49cf] mb-4"></div>
                                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Loading Content</p>
            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
              Just a moment while we fetch your content...
            </p>
          <div className="mt-4 flex space-x-1">
            <div className="w-2 h-2 bg-[#4f49cf] rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-[#6d63d4] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-[#cf4f84] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );



  // Action handler for Universal Widget Schema interactions
  const handleAction = useCallback(async (action: ActionData) => {
    console.log('[DynamicTenantPage] Action triggered:', action);

    // ✅ ARCHITECTURAL FIX: Use action registry instead of hardcoded switch statement
    try {
      await defaultActionRegistry.handle(action);
    } catch (error) {
      console.error('[DynamicTenantPage] Action handling failed:', error);
    }
  }, []);

  // Memoize content component to prevent video re-mounting - MUST be at top level before any returns
  const contentComponent = useMemo(() => {
    // Reduced debug logging to prevent console spam during render loops
    // console.log('[DynamicTenantPage] contentComponent memo triggered:', { contentLoading, schemaType, content, hasComponent: content && typeof content === 'object' && 'component' in content });

    if (contentLoading) {
      return createLoadingContent();
    }

    // Check for static page response
    if (schemaType === 'static_page' && content && typeof content === 'object' && 'route' in content) {
      console.log('[DynamicTenantPage] Rendering static page within ContentPanel:', content);
      const staticPageContent = content as {
        route: string;
        title?: string;
        componentId?: string;
      };

      // Map routes to their corresponding page components
      const routeComponentMap: Record<string, string> = {
        'context/preferences': 'PromptContextsPage'
      };

      const componentName = routeComponentMap[staticPageContent.route];

      if (componentName) {
        // Dynamically import the page component through mockup system
        const PageComponent = React.lazy(() => import(`./mockups/${componentName}`));

        return (
          <div className="static-page-content">
            <React.Suspense fallback={createLoadingContent()}>
              <PageComponent />
            </React.Suspense>
          </div>
        );
      } else {
        console.warn('[DynamicTenantPage] No component mapped for static page route:', staticPageContent.route);
        return (
          <div className="p-6">
            <div className="text-center">
              <div className="text-gray-500 mb-4">📄</div>
              <p className="text-gray-600">Static page component not found for route: {staticPageContent.route}</p>
            </div>
          </div>
        );
      }
    }

    // Check for mockup agent response
    if (schemaType === 'mockup' && content && typeof content === 'object' && 'component' in content) {
      console.log('[DynamicTenantPage] Rendering mockup agent response:', content);
      const mockupContent = content as {
        component: string;
        title?: string;
        subtitle?: string;
        metadata?: Record<string, unknown>
      };

      // Dynamically import MockupRenderer
      const MockupRenderer = React.lazy(() => import('./ui/MockupRenderer'));

      return (
        <div className="p-6">
          <React.Suspense fallback={createLoadingContent()}>
            <MockupRenderer
              componentName={mockupContent.component}
              title={mockupContent.title}
              subtitle={mockupContent.subtitle}
              metadata={mockupContent.metadata}
            />
          </React.Suspense>
        </div>
      );
    }

    if (isComponentSchema || isUniversalWidgetSchema) {
      console.log('[DynamicTenantPage] Rendering UniversalSchemaRenderer with userId:', {
        session: !!session,
        userId: session?.user?.id,
        authLoading,
        sessionUser: session?.user,
        schemaType: content && typeof content === 'object' && 'type' in content ? content.type : 'unknown'
      });
      return (
        <div className="p-6">
          <UniversalSchemaRenderer
            schema={content as UniversalWidgetSchema}
            userId={session?.user?.id}
            tenantKey={currentTenant}
            onAction={handleAction}
            onProgressUpdate={() => {
              // ✅ FIXED: No need to refresh content - progress tracking is handled automatically
              // Progress updates should not trigger content reloads as they don't change the content structure
              console.log('[DynamicTenantPage] Video progress updated - no content refresh needed');
            }}
          />
        </div>
      );
    }

    if (isWelcomeContent) {
      return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center max-w-md">
            <div className="mb-4 text-4xl" style={{ color: 'var(--primary, #667eea)' }}>✨</div>
            <h2 className="text-2xl font-semibold mb-4">
              {'title' in content ? content.title : 'Welcome'}
            </h2>
            <p className="text-gray-600 mb-6">
              {'description' in content ? content.description : 'Loading content...'}
            </p>
            <div className="px-4 py-2 rounded-lg inline-block" style={{ backgroundColor: 'var(--bg-neutral, #e8f4f8)', color: 'var(--primary, #667eea)' }}>
              {'action' in content ? content.action : 'Please wait'}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-gray-500 mb-4">📄</div>
          <p className="text-gray-600">
            {typeof content === 'string' ? content :
             (content && typeof content === 'object' && 'message' in content ? content.message : 'Content loaded successfully')}
          </p>
        </div>
      </div>
    );
  }, [contentLoading, isComponentSchema, isUniversalWidgetSchema, isWelcomeContent, content, schemaType]);

  // 🤖 AGENT-NATIVE: Single API call to get complete UI schema
  useEffect(() => {
    const fetchAgentSchema = async () => {
      // Wait for authentication to complete
      if (authLoading) {
        setLoading(true);
        return;
      }

      // If auth is complete but no session, that's an error
      if (!session?.user?.id) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[DynamicTenantPage] Database-driven mode - creating welcome schema for tenant:', currentTenant);
        }

        // 🗄️ DATABASE-DRIVEN: Create simple welcome schema without agent calls
                // ✅ FIXED: Use database display_name instead of hard-coded contextNames
        const tenantConfig = props.initialTenants?.find(t => t.tenant_key === currentTenant);
        const tenantDisplayName = (tenantConfig as Record<string, unknown>)?.display_name as string ||
                                  tenantConfig?.name ||
                                  currentTenant.charAt(0).toUpperCase() + currentTenant.slice(1);

        const welcomeSchema: AgentSchema = {
          type: 'content_schema',
          content: {
            type: 'welcome',
            title: tenantDisplayName,
            description: 'Select an option from the navigation to get started.',
            action: 'Browse Navigation'
          }
        };

        if (process.env.NODE_ENV === 'development') {
          console.log('[DynamicTenantPage] Database-driven welcome schema created:', welcomeSchema);
        }

        setAgentSchema(welcomeSchema);
        setError(null);
        console.log('[DynamicTenantPage] Welcome schema set successfully:', welcomeSchema);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[DynamicTenantPage] Welcome schema creation failed:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentSchema();
  }, [session?.user?.id, currentTenant, authLoading]);

  // Apply tenant class to body and root for global CSS variable access
  useEffect(() => {
    // Add tenant class to body and html root
    document.body.className = `tenant-${currentTenant}`;
    document.documentElement.className = `tenant-${currentTenant}`;

    return () => {
      // Cleanup: remove tenant classes
      document.body.className = '';
      document.documentElement.className = '';
    };
  }, [currentTenant]);

  // Handle tenant change - also persist the change
  const handleTenantChange = (tenantKey: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DynamicTenantPage] Tenant changed to:', tenantKey);
    }
    setCurrentTenant(tenantKey);

    // Clear selected navigation when context changes
    setSelectedNavOptionId(null);

    // Trigger user preferences refresh for new tenant
    setShouldFetchUserPrefs(true);

    // Persist context change to user preferences
    if (session?.user?.id) {
      fetch(`/api/user/${session.user.id}/navigation-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantKey,
          navOptionId: null // Clear nav selection when changing tenant
        })
      }).catch(error => {
        console.warn('[DynamicTenantPage] Failed to persist context change:', error);
      });
    }
  };

  // Helper function to load content for a navigation option
  const loadContentForNavOption = async (navId: string, updateSelection: boolean = true) => {
    if (!session?.user?.id) {
      console.error('[DynamicTenantPage] No user session for navigation');
      return;
    }

    console.log('[DynamicTenantPage] 🚀 LOADING content for navigation option:', {
      navId,
      updateSelection,
      currentTenant,
      userId: session.user.id
    });

    // Update selected navigation option if requested
    if (updateSelection) {
      setSelectedNavOptionId(navId);
    }

    // Show loading state while fetching content
    setContentLoading(true);

        // 20-second timeout for agent content API (LangGraph needs 8-13 seconds)
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout>;

    try {
      // ✅ FIRST: Check if this is a direct route navigation option
      console.log('[DynamicTenantPage] 🔍 Checking navigation option routing type...');

      const navCheckResponse = await fetch('/api/nav/option-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          navOptionId: navId,
          tenantKey: currentTenant
        })
      });

      if (navCheckResponse.ok) {
        const navDetails = await navCheckResponse.json();
        console.log('[DynamicTenantPage] 📋 Navigation option details:', navDetails);

        // Handle different routing types
        if (navDetails.routing_type === 'direct') {
          console.log('[DynamicTenantPage] 🔀 Direct route detected, navigating to:', navDetails.nav_key);
          setContentLoading(false);
          window.location.href = `/${navDetails.nav_key}`;
          return;
        } else if (navDetails.routing_type === 'static_page') {
          console.log('[DynamicTenantPage] 📄 Static page detected, rendering in ContentPanel:', navDetails.nav_key);
          setContentLoading(false);

          // Render static page within ContentPanel instead of navigating away
          setAgentSchema({
            type: 'static_page',
            content: {
              type: 'static_page_content',
              route: navDetails.nav_key,
              title: navDetails.label,
              componentId: `static-${navDetails.nav_key.replace('/', '-')}`
            },
            metadata: {
              agentId: navDetails.agent_id,
              agentType: 'static_page'
            }
          });
          return;
        }
      }

      // ✅ FALLBACK: Continue with agent-based routing
      console.log('[DynamicTenantPage] 🤖 Using agent-based routing...');

      timeoutId = setTimeout(() => controller.abort(), 20000);

      // Call the agent content API
      const response = await fetch('/api/agent/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          userId: session.user.id,
          tenantKey: currentTenant,
          navOptionId: navId,
          intent: {
            message: `Show me content for navigation option ${navId}`
          }
        })
      });

      window.clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: { message?: string; error?: string };
        try {
          errorData = await response.json() as { message?: string; error?: string };
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }

        console.error('[DynamicTenantPage] Agent API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });

        // Clear loading state
        setContentLoading(false);

        // Show error state with more details
        setAgentSchema({
          type: 'error',
          content: {
            type: 'error',
            title: 'Unable to Load Content',
            description: errorData.error || errorData.message || `Server error: ${response.status}`,
            action: 'Retry'
          }
        });
        return;
      }

      const agentResponse = await response.json();
      console.log('[DynamicTenantPage] Agent response:', agentResponse);

      // Clear loading state
      setContentLoading(false);

      // Handle different response types
      if (agentResponse.type === 'no_agent') {
        // No agent assigned - show placeholder
        setAgentSchema({
          type: 'content_schema',
          content: {
            type: 'welcome',
            title: 'Feature Coming Soon',
            description: agentResponse.message || `The ${navId} feature is being prepared for you.`,
            action: 'Check back soon!'
          }
        });
      } else if (agentResponse.type === 'mockup') {
        // Mockup agent response - preserve type and content structure
        console.log('[DynamicTenantPage] Setting mockup agent schema:', agentResponse);
        setAgentSchema({
          type: 'mockup',
          content: agentResponse.content,
          metadata: agentResponse.metadata
        });
      } else if (agentResponse.type === 'direct_route') {
        // Direct route agent response - navigate immediately to the route
        console.log('[DynamicTenantPage] Direct route agent response:', agentResponse);
        const routeInfo = agentResponse.content as { route: string; title?: string; description?: string };

        if (routeInfo?.route) {
          console.log('[DynamicTenantPage] 🔀 Direct agent route detected, navigating to:', routeInfo.route);
          setContentLoading(false);

          // Navigate directly to the route (route already includes leading slash)
          window.location.href = routeInfo.route;
          return;
        } else {
          console.error('[DynamicTenantPage] Direct route response missing route information');
          setAgentSchema({
            type: 'error',
            content: {
              type: 'error',
              title: 'Invalid Direct Route',
              description: 'Direct route response is missing route information',
              action: 'Retry'
            }
          });
        }
      } else if (agentResponse.type === 'content_schema' || agentResponse.schema) {
        // Agent returned content schema
        setAgentSchema(agentResponse);
      } else {
        // Transform agent response to expected format
        setAgentSchema({
          type: 'content_schema',
          content: agentResponse
        });
      }

    // ✅ FIX: Navigation state is already persisted by NavPanel via useNavigationState hook
    // Remove duplicate navigation state saving to prevent race conditions
    console.log('[DynamicTenantPage] ✅ Content loaded successfully for navigation option:', navId);

    // Refetch user preferences after a delay to ensure any navigation state changes are reflected
    setTimeout(async () => {
      console.log('[DynamicTenantPage] 🔄 Refetching user preferences after content load...');
      await refetchUserPrefs();
      console.log('[DynamicTenantPage] ✅ User preferences refetched successfully');
    }, 500); // Shorter delay since we're not waiting for our own DB write

  } catch (error) {
      window.clearTimeout(timeoutId);
      console.error('[DynamicTenantPage] Network error calling agent:', error);

      // Clear loading state
      setContentLoading(false);

      // Handle timeout specifically
      if ((error as Error).name === 'AbortError') {
        setAgentSchema({
          type: 'error',
          content: {
            type: 'error',
            title: 'Request Timeout',
            description: 'The content request took too long. Please try again.',
            action: 'Retry'
          }
        });
        return;
      }

      // Show network error state
      setAgentSchema({
        type: 'error',
        content: {
          type: 'error',
          title: 'Connection Error',
          description: 'Unable to connect to the server. Please check your connection.',
          action: 'Retry'
        }
      });
    }
  };

  // 🤖 AGENT-NATIVE: Navigation selection with agent invocation
  const handleNavSelect = async (navId: string) => {
    // Update selection and load content
    setSelectedNavOptionId(navId);
    await loadContentForNavOption(navId, false); // Don't update selection again
  };

  // Authentication guard - redirect to login if no session and auth loading is complete
  useEffect(() => {
    if (!authLoading && !session) {
      console.log('[DynamicTenantPage] No session found, redirecting to login');
      window.location.href = '/login';
      return;
    }
  }, [authLoading, session]);

  // SYNC authentication check - redirect immediately if no session
  if (!authLoading && !session) {
    console.log('[DynamicTenantPage] No session - redirecting to login synchronously');
    window.location.href = '/login';
    return null; // Prevent any rendering
  }

  // Show loading state while waiting for auth or initialization
  if (authLoading || (!hasRestoredTenant && !userPrefsError && session)) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/leaderforge-icon-large.png" alt="LeaderForge" width={48} height={48} />
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-spinner mb-4"></div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {authLoading ? 'Authenticating...' : 'Loading Experience'}
            </p>
            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
              {authLoading ? 'Verifying your credentials...' : 'Setting up your personalized experience...'}
            </p>
                          <div className="mt-4 flex space-x-1">
                <div className="w-2 h-2 bg-primary-dot rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-secondary-dot rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-accent-dot rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state - no fallback schema
  if (error && !agentSchema) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/leaderforge-icon-large.png" alt="LeaderForge" width={48} height={48} />
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-4 text-2xl">⚠️</div>
            <p className="text-sm font-medium text-gray-800 mb-2">Response Error</p>
            <p className="text-xs text-gray-600 text-center mb-6">Invalid agent response - please refresh</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#4f49cf] text-white text-sm rounded-xl hover:bg-[#423db8] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check for valid agent response based on type
  if (!agentSchema) {
    console.log('[DynamicTenantPage] No agentSchema found - showing invalid response error');
    console.log('[DynamicTenantPage] Current state:', { agentSchema, loading, error, authLoading });
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/leaderforge-icon-large.png" alt="LeaderForge" width={48} height={48} />
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-4 text-2xl">⚠️</div>
            <p className="text-sm font-medium text-gray-800 mb-2">Response Error</p>
            <p className="text-xs text-gray-600 text-center mb-6">Invalid agent response - please refresh</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#4f49cf] text-white text-sm rounded-xl hover:bg-[#423db8] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle different response types OR show loading content with navigation
  console.log('[DynamicTenantPage] Checking agentSchema type:', agentSchema?.type, 'has content:', !!agentSchema?.content, 'contentLoading:', contentLoading);

  // If we're loading content or have content, show the layout with navigation
  if (contentLoading || ((agentSchema?.type === 'content_schema' || agentSchema?.type === 'error' || agentSchema?.type === 'mockup' || agentSchema?.type === 'static_page') && agentSchema.content)) {
    console.log('[DynamicTenantPage] Handling content_schema response or loading state');
    console.log('[DynamicTenantPage] agentSchema.content:', agentSchema?.content);

    // Navigation is now handled by NavPanel's database-driven approach

    // Create nav component using database-driven approach
    const NavComponent = ({ isCollapsed, onToggleCollapse }: { isCollapsed?: boolean; onToggleCollapse?: () => void }) => {
      console.log('[DynamicTenantPage] 🔧 NavComponent rendering with selectedNavOptionId:', selectedNavOptionId);
      return (
        <NavPanel
          tenantKey={currentTenant}
          contextOptions={props.initialTenants?.map(ctx => ({
            id: ctx.tenant_key,
            title: ctx.name || ctx.tenant_key,
            subtitle: (ctx.description as string) || 'AI-Powered Experience',
            icon: 'star'
          })) || []}
          selectedTenantKey={currentTenant}
          onContextChange={handleTenantChange}
          onNavSelect={handleNavSelect}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          userId={session?.user?.id}
          selectedNavOptionId={selectedNavOptionId}
        />
      );
    };

            // Use the proper tenant-specific theme from database
    const tenantConfig = props.initialTenants?.find(ctx => ctx.tenant_key === currentTenant) || props.initialTenantConfig;
    const defaultTheme = {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#4ecdc4',
      bg_light: '#f8f9ff',
      bg_neutral: '#e8f4f8',
      text_primary: '#333333',
      bg_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };

        // Get theme from database config (tenant theme should be a JSONB object)
    let theme = defaultTheme;
    if (tenantConfig && typeof tenantConfig === 'object' && 'theme' in tenantConfig && tenantConfig.theme) {
      if (typeof tenantConfig.theme === 'string') {
        // If theme is a string like "leaderforge", map it to a predefined theme
        const predefinedThemes: Record<string, typeof defaultTheme> = {
          leaderforge: {
            primary: '#001848',        // Deep navy
            secondary: '#008ee6',      // Light blue
            accent: '#008ee6',         // Light blue
            bg_light: '#f7f9fc',       // Light grey background
            bg_neutral: '#e0f7ff',     // Light blue accents
            text_primary: '#001848',   // Deep navy text
            bg_gradient: 'linear-gradient(135deg, #008ee6 0%, #e0f7ff 50%, #f0f4ff 100%)'
          },
          brilliant: {
            primary: '#3e5e17',        // Earth Green
            secondary: '#74a78e',      // Sage Green
            accent: '#dd8d00',         // Golden Yellow
            bg_light: '#f8f4f1',       // Warm White
            bg_neutral: '#e3ddc9',     // Beige
            text_primary: '#222222',   // Dark Grey
            bg_gradient: 'linear-gradient(135deg, #74a78e 0%, #dd8d00 50%, #3e5e17 100%)'
          }
        };
        theme = predefinedThemes[tenantConfig.theme] || defaultTheme;
      } else if (typeof tenantConfig.theme === 'object' && tenantConfig.theme !== null) {
        // If theme is a JSONB object, use it directly
        theme = { ...defaultTheme, ...(tenantConfig.theme as Record<string, string>) };
      }
    }

    return (
      <div
        className={`tenant-${currentTenant}`}
        style={{
        '--primary': theme.primary,
        '--secondary': theme.secondary,
        '--accent': theme.accent,
        '--bg-light': theme.bg_light,
        '--bg-neutral': theme.bg_neutral,
        '--text-primary': theme.text_primary,
        '--card-bg': theme.bg_light || '#ffffff'
      } as React.CSSProperties & Record<string, string>}>
        <ThreePanelLayout
          nav={<NavComponent />}
          content={contentComponent}
          contextConfig={{
            theme: {
              primary: theme.primary,
              secondary: theme.secondary,
              accent: theme.accent,
              bg_light: theme.bg_light,
              bg_neutral: theme.bg_neutral,
              text_primary: theme.text_primary,
              bg_gradient: theme.bg_gradient
            }
          }}
        />

        {/* Video Modal */}
        {isVideoModalOpen && videoModalData && (
          <Suspense fallback={
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
              <div className="bg-white rounded-xl p-6 shadow-2xl">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading video player...</span>
                </div>
              </div>
            </div>
          }>
            <DynamicVideoPlayerModal
              schema={{
                type: 'VideoPlayer',
                id: `video-modal-${Date.now()}`,
                data: {
                  videoUrl: videoModalData.videoUrl,
                  poster: videoModalData.poster,
                  description: videoModalData.description,
                  progress: videoModalData.progress || 0,
                  // Critical: Pass contentId for proper progress tracking correlation
                  contentId: (videoModalData.parameters as Record<string, unknown>)?.contentId || (videoModalData as Record<string, unknown>).contentId
                },
                config: {
                  title: videoModalData.title,
                  autoplay: true,
                  actions: videoModalData.onCompleteAction ? [videoModalData.onCompleteAction] : []
                },
                version: '1.0'
              } as unknown as UniversalWidgetSchema}
              open={isVideoModalOpen}
              onOpenChange={(open) => {
                setIsVideoModalOpen(open);
                if (!open) {
                  setVideoModalData(null);
                }
              }}
              userId={session?.user?.id}
              tenantKey={currentTenant}
              onProgressUpdate={(finalProgress: number) => {
                console.log('[DynamicTenantPage] Video modal closed with progress:', finalProgress);

                // Update the card's local progress via the onRealTimeProgressUpdate callback
                if (videoModalData?.onRealTimeProgressUpdate && typeof videoModalData.onRealTimeProgressUpdate === 'function') {
                  console.log('[DynamicTenantPage] Updating card progress via callback:', finalProgress);
                  videoModalData.onRealTimeProgressUpdate(finalProgress);
                } else {
                  console.warn('[DynamicTenantPage] No onRealTimeProgressUpdate callback found in videoModalData');
                }

                // Progress tracking is handled automatically by the video modal
                // No content refresh needed as progress updates don't change content structure
              }}
            />
          </Suspense>
        )}

        {/* Worksheet Modal */}
        {isWorksheetModalOpen && worksheetModalData && (() => {
          // ✅ Memoize videoContext to prevent unnecessary re-renders and multiple template fetches
          const videoContext = {
            id: worksheetModalData.contentId,
            title: worksheetModalData.title
          };

          return (
            <FormWidget
              templateId={worksheetModalData.templateId || '663570eb-babd-41cd-9bfa-18972275863b'}
              isOpen={isWorksheetModalOpen}
              onClose={() => {
                setIsWorksheetModalOpen(false);
                setWorksheetModalData(null);
              }}
              videoContext={videoContext}
              onSubmit={async (submissionData) => {
                console.log('[DynamicTenantPage] Worksheet submitted:', submissionData);
                // ✅ No content refresh needed - worksheet submission doesn't change the content state
                // Progress tracking and leaderboard updates happen automatically via Universal Input System
                console.log('[DynamicTenantPage] Worksheet submission complete - no ContentPanel refresh needed');
                setIsWorksheetModalOpen(false);
                setWorksheetModalData(null);
              }}
            />
          );
        })()}
      </div>
    );
  }

  // 🚨 SHOULD NEVER REACH HERE - All valid responses handled above
  console.error('[DynamicTenantPage] Unhandled agentSchema type:', agentSchema.type);
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <img src="/logos/leaderforge-icon.png" alt="LeaderForge Icon" width={40} height={40} />
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-red-500 mb-4 text-2xl">⚠️</div>
          <p className="text-sm font-medium text-gray-800 mb-2">System Error</p>
          <p className="text-xs text-gray-600 text-center mb-6">Unhandled response type: {agentSchema.type}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#4f49cf] text-white text-sm rounded-xl hover:bg-[#423db8] transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

// Removed React.memo as it was causing excessive re-renders
