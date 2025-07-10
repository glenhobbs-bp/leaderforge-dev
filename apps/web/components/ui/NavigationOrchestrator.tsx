"use client";
// File: apps/web/components/ui/NavigationOrchestrator.tsx
// Purpose: Orchestrates navigation, agent calls, and layout management for the main tenant page
// Owner: Frontend Team
// Tags: #navigation #agent-orchestration #layout #tenant-management

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ThreePanelLayout from './ThreePanelLayout';
import NavPanel from './NavPanel';
import { ContentRenderer } from './ContentRenderer';
import { ModalManager } from './ModalManager';
import type { TenantConfig } from '../../app/lib/types';
import { initializeDefaultHandlers, type ActionData } from '../../app/lib/widgetActionRegistry';

interface AgentSchema {
  type: 'content_schema' | 'no_agent' | 'error' | 'mockup' | 'direct_route' | 'static_page';
  content?: unknown;
  message?: string;
  metadata?: {
    threadId?: string;
    runId?: string;
    agentId?: string;
    agentName?: string;
    agentType?: string;
    directRoute?: string;
  };
}

interface VideoModalData {
  action: string;
  label: string;
  title?: string;
  videoUrl?: string;
  poster?: string;
  description?: string;
  progress?: number;
  parameters?: Record<string, unknown>;
  onCompleteAction?: unknown;
  onRealTimeProgressUpdate?: (progress: number) => void;
  [key: string]: unknown;
}

interface WorksheetModalData {
  contentId: string;
  title: string;
  templateId?: string;
  agentReasoning?: string;
  contentAnalysis?: string;
  [key: string]: unknown;
}

interface NavigationOrchestratorProps {
  initialTenants?: TenantConfig[];
  initialTenantConfig?: unknown;
  defaultTenantKey?: string;
  userId?: string;
  isReady: boolean;
  selectedNavOptionId?: string | null;
}

export function NavigationOrchestrator({
  initialTenants,
  initialTenantConfig,
  defaultTenantKey,
  userId,
  isReady,
  selectedNavOptionId: propSelectedNavOptionId
}: NavigationOrchestratorProps) {
  // Core tenant state
  const [currentTenant, setCurrentTenant] = useState<string>(
    defaultTenantKey || initialTenants?.[0]?.tenant_key || 'leaderforge'
  );

  // Agent and content state
  const [agentSchema, setAgentSchema] = useState<AgentSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNavOptionId, setSelectedNavOptionId] = useState<string | null>(null);

  // Ref to track the current navigation state and prevent race conditions
  const currentNavIdRef = useRef<string | null>(null);

  // Modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoModalData, setVideoModalData] = useState<VideoModalData | null>(null);
  const [isWorksheetModalOpen, setIsWorksheetModalOpen] = useState(false);
  const [worksheetModalData, setWorksheetModalData] = useState<WorksheetModalData | null>(null);

  // Initialize widget action registry with modal handlers
  useEffect(() => {
    if (userId) {
      initializeDefaultHandlers({
        setVideoModalData,
        setIsVideoModalOpen,
        setWorksheetModalData,
        setIsWorksheetModalOpen
      });
    }
  }, [userId]);

  // ✅ FIX: Initialize loading state properly
  useEffect(() => {
    if (isReady) {
      // All initialization complete, ensure loading is false
      setLoading(false);
    }
  }, [isReady]);

  // Handle selected navigation option from props (e.g., user preferences restoration)
  // RACE CONDITION FIX: Only trigger when prop changes AND it's different from current state
  useEffect(() => {
    if (propSelectedNavOptionId && propSelectedNavOptionId !== currentNavIdRef.current && isReady && userId) {
      console.log('[NavigationOrchestrator] 🔄 Prop selectedNavOptionId changed:', propSelectedNavOptionId, 'current ref:', currentNavIdRef.current);
      currentNavIdRef.current = propSelectedNavOptionId;
      setSelectedNavOptionId(propSelectedNavOptionId);
      // Use a flag to prevent saving state during prop-driven navigation
      loadContentForNavOption(propSelectedNavOptionId, false, true);
    }
  }, [propSelectedNavOptionId, isReady, userId]); // Using ref instead of state to prevent race condition

  // 🤖 AGENT-NATIVE: Fetch agent schema for navigation option
  const fetchAgentSchema = useCallback(async (navId: string) => {
    if (!userId) {
      console.error('[NavigationOrchestrator] No user session - cannot fetch agent schema');
      return;
    }

    try {
      console.log('[NavigationOrchestrator] 🔧 Fetching agent schema for navId:', navId, 'tenant:', currentTenant);
      setContentLoading(true);
      setError(null);

      // Use POST request as expected by the agent content API
      const response = await fetch('/api/agent/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          tenantKey: currentTenant,
          navOptionId: navId,
          intent: {
            message: `Load content for navigation option ${navId}`
          }
        })
      });

      console.log('[NavigationOrchestrator] Agent response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[NavigationOrchestrator] Agent response error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Agent request failed: ${response.status} ${response.statusText}`);
      }

      const schema = await response.json();
      console.log('[NavigationOrchestrator] ✅ Agent schema received:', schema);
      setAgentSchema(schema);
    } catch (error) {
      console.error('[NavigationOrchestrator] Error fetching agent schema:', error);
      setError(error instanceof Error ? error.message : 'Failed to load content');
    } finally {
      setContentLoading(false);
    }
  }, [userId, currentTenant]);

  // Handle tenant changes - triggers context switch
  const handleTenantChange = useCallback((tenantKey: string) => {
    console.log('[NavigationOrchestrator] Tenant change:', tenantKey);
    setCurrentTenant(tenantKey);
    // Clear selected nav option when switching tenants
    setSelectedNavOptionId(null);
    setAgentSchema(null);
  }, []);

  // Load content for a specific navigation option
  const loadContentForNavOption = useCallback(async (navId: string, updateSelection: boolean = true, skipStateSave: boolean = false) => {
    console.log('[NavigationOrchestrator] 🔧 Loading content for nav option:', navId, 'updateSelection:', updateSelection, 'skipStateSave:', skipStateSave);

    if (updateSelection) {
      currentNavIdRef.current = navId;
      setSelectedNavOptionId(navId);
    }

    // Save navigation state to user preferences via API call (skip if this is prop-driven navigation)
    if (userId && !skipStateSave) {
      try {
        console.log('[NavigationOrchestrator] 💾 Saving navigation state:', {
          tenantKey: currentTenant,
          navId: navId,
          userId: userId
        });

        const saveResponse = await fetch(`/api/user/${userId}/preferences`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferences: {
              navigationState: {
                lastTenant: currentTenant,
                lastNavOption: navId,
                lastUpdated: new Date().toISOString()
              }
            }
          })
        });

        if (!saveResponse.ok) {
          console.warn('[NavigationOrchestrator] Failed to save navigation state:', saveResponse.status, saveResponse.statusText);
        } else {
          console.log('[NavigationOrchestrator] ✅ Navigation state saved successfully');
        }
      } catch (error) {
        console.warn('[NavigationOrchestrator] Error saving navigation state:', error);
      }
    }

    // Fetch content via agent
    await fetchAgentSchema(navId);
  }, [userId, currentTenant, fetchAgentSchema]);

  // 🤖 AGENT-NATIVE: Navigation selection with agent invocation
  const handleNavSelect = useCallback(async (navId: string) => {
    console.log('[NavigationOrchestrator] 🎯 handleNavSelect called with navId:', navId, 'current ref:', currentNavIdRef.current);

    // RACE CONDITION FIX: Update ref immediately to prevent duplicate loads
    currentNavIdRef.current = navId;

    // Update selection and load content
    console.log('[NavigationOrchestrator] 🔄 Setting selectedNavOptionId to:', navId);
    setSelectedNavOptionId(navId);

    console.log('[NavigationOrchestrator] 🔧 Loading content for navId:', navId);
    await loadContentForNavOption(navId, true, true); // Update selection and skip state save (NavPanel handles it)

    console.log('[NavigationOrchestrator] ✅ handleNavSelect completed for navId:', navId);
  }, [loadContentForNavOption]);

  // Create nav component using database-driven approach
  const NavComponent = useCallback(({ isCollapsed, onToggleCollapse }: { isCollapsed?: boolean; onToggleCollapse?: () => void }) => {
    // ✅ FIX: Remove console logs that were contributing to infinite render loops
    return (
      <NavPanel
        tenantKey={currentTenant}
        contextOptions={initialTenants?.map(ctx => ({
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
        userId={userId}
        selectedNavOptionId={selectedNavOptionId}
      />
    );
  }, [currentTenant, initialTenants, handleTenantChange, handleNavSelect, userId, selectedNavOptionId]);

  // Use the proper tenant-specific theme from database
  const tenantConfig = initialTenants?.find(ctx => ctx.tenant_key === currentTenant) || initialTenantConfig;
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

  // Handle action events from ContentRenderer
  const handleAction = useCallback((action: ActionData) => {
    console.log('[NavigationOrchestrator] Action received from ContentRenderer:', action);
    // Actions are already handled by the ContentRenderer and registry
    // This is just for any additional orchestration if needed
  }, []);

  // If we're loading content or have content, show the layout with navigation
  if (contentLoading || ((agentSchema?.type === 'content_schema' || agentSchema?.type === 'error' || agentSchema?.type === 'mockup' || agentSchema?.type === 'static_page') && agentSchema.content)) {
    // ✅ FIX: Remove console logs that were contributing to infinite render loops

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
          content={
            <ContentRenderer
              agentSchema={agentSchema}
              contentLoading={contentLoading}
              error={error}
              userId={userId}
              tenantKey={currentTenant}
              onAction={handleAction}
              onProgressUpdate={() => {
                // ✅ FIXED: No need to refresh content - progress tracking is handled automatically
                console.log('[NavigationOrchestrator] Progress update - no content refresh needed');
              }}
            />
          }
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

        <ModalManager
          isVideoModalOpen={isVideoModalOpen}
          videoModalData={videoModalData}
          onVideoModalOpenChange={setIsVideoModalOpen}
          onVideoModalDataChange={setVideoModalData}
          isWorksheetModalOpen={isWorksheetModalOpen}
          worksheetModalData={worksheetModalData}
          onWorksheetModalOpenChange={setIsWorksheetModalOpen}
          onWorksheetModalDataChange={setWorksheetModalData}
          userId={userId}
          tenantKey={currentTenant}
        />
      </div>
    );
  }

  // Check for valid agent response based on type
  if (!agentSchema) {
    console.log('[NavigationOrchestrator] No agentSchema found - showing invalid response error');
    console.log('[NavigationOrchestrator] Current state:', { agentSchema, loading, error });
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

  // 🚨 SHOULD NEVER REACH HERE - All valid responses handled above
  console.error('[NavigationOrchestrator] Unhandled agentSchema type:', agentSchema.type);
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