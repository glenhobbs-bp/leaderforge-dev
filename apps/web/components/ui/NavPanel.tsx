"use client";

// File: apps/web/components/ui/NavPanel.tsx
// Purpose: Navigation panel for agent-native app, themed via contextConfig
// Owner: Frontend team
// Tags: UI, navigation, context-based, React

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import ContextSelector from "./ContextSelector";
import { useSupabase } from '../SupabaseProvider';
import { useNavigation } from '../../hooks/useNavigation';
import { useAvatar } from '../../hooks/useAvatar';
import { useNavigationState } from '../../app/hooks/useNavigationState';
import { authService } from '../../app/lib/authService';
import * as LucideIcons from "lucide-react";
import { UserProfileModal } from "./UserProfileModal";

// Export function to force avatar refresh for a user (now uses React Query)
export function forceAvatarRefresh(userId: string) {
  // Trigger a custom event that NavPanel can listen to
  window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { userId } }));
  if (process.env.NODE_ENV === 'development') {
    console.log('[NavPanel] Triggered avatar refresh for user:', userId);
  }
}

// Convert kebab-case to PascalCase for Lucide icons
function toPascalCase(str: string) {
  return str
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

// Keep the NavPanelSchema type for compatibility
export interface NavPanelSchema {
  type: "NavPanel";
  props: {
    header?: {
      greeting?: string;
      avatarUrl?: string;
    };
    sections: {
      title?: string | null;
      items: Array<{
        id: string;
        label: string;
        icon?: string;
        href?: string;
        description?: string;
        position?: "bottom";
      }>;
    }[];
    footer?: {
      profile?: { name: string; avatarUrl?: string };
      actions?: Array<{
        label: string;
        action: string;
        icon?: string;
      }>;
    };
  };
}

interface NavPanelProps {
  tenantKey: string; // Database-driven: tenant key for navigation query
  contextOptions?: {
    id: string;
    title: string;
    subtitle?: string;
    icon?: string;
  }[];
  selectedTenantKey?: string; // Current selected tenant - should match tenantKey
  onContextChange?: (id: string) => void;
  onNavSelect?: (navOptionId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  userId?: string | null;
  selectedNavOptionId?: string | null;
}

export default function NavPanel({
  tenantKey,
  contextOptions = [],
  selectedTenantKey,
  onContextChange,
  onNavSelect,
  isCollapsed = false,
  onToggleCollapse,
  userId,
  selectedNavOptionId,
}: NavPanelProps) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[NavPanel] RENDER - Database-driven with tenantKey:', tenantKey);
  }

  const [selectedNav, setSelectedNav] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false); // Track user interaction
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { supabase } = useSupabase();

  // Database-driven navigation using the tenant key
  const { navSchema, loading, error } = useNavigation(tenantKey, userId);

  // Avatar fetching with React Query
  const { data: avatarUrl = "/icons/default-avatar.svg" } = useAvatar(userId);

  // Navigation state persistence (temporarily disabled for performance)
  const {
    lastNavOptionId,
    updateNavigationState
  } = useNavigationState({
    userId: userId || '',
    tenantKey: tenantKey
  });

  // Navigation state persistence restored with optimizations

  // Listen for avatar update events and refetch when needed
  useEffect(() => {
    if (!userId) return;

    const handleAvatarUpdate = (event: CustomEvent) => {
      if (event.detail.userId === userId) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[NavPanel] Avatar update event received for user:', userId, '- refreshing avatar');
        }
        // Invalidate avatar queries to trigger refresh
        // Note: This happens when UserProfileModal closes, not during upload
        window.dispatchEvent(new CustomEvent('refetchAvatar', { detail: { userId } }));
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);

    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    };
  }, [userId]);



  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[NavPanel] navSchema changed:', navSchema);
    }
  }, [navSchema]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[NavPanel] selectedTenantKey changed:', selectedTenantKey);
    }
    // Reset user interaction flag when tenant changes to allow restoration
    setHasUserInteracted(false);
    setSelectedNav(null); // Clear selection for new tenant
  }, [selectedTenantKey]);

  // Initialize selected nav from persisted state only on first load and if user hasn't interacted
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[NavPanel] Navigation state restoration check:', {
        lastNavOptionId,
        selectedNav,
        hasUserInteracted,
        tenantKey: tenantKey,
        shouldRestore: lastNavOptionId && !selectedNav && !hasUserInteracted
      });
    }

    if (lastNavOptionId && !selectedNav && !hasUserInteracted) {
      setSelectedNav(lastNavOptionId);
      if (process.env.NODE_ENV === 'development') {
        console.log('[NavPanel] Restored navigation state:', lastNavOptionId);
      }
    }
  }, [lastNavOptionId, hasUserInteracted, tenantKey]); // Track user interaction to prevent override

  // Update selected nav when selectedNavOptionId prop changes (from parent component)
  useEffect(() => {
    if (selectedNavOptionId && selectedNavOptionId !== selectedNav) {
      setSelectedNav(selectedNavOptionId);
      if (process.env.NODE_ENV === 'development') {
        console.log('[NavPanel] Updated selected nav from prop:', selectedNavOptionId);
      }
    }
  }, [selectedNavOptionId, selectedNav]);

  // Debug modal state changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[NavPanel] Profile modal state changed:', isProfileModalOpen);
    }
  }, [isProfileModalOpen]);

  const handleNavClick = (navOptionId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[NavPanel] handleNavClick:', {
        navOptionId,
        tenantKey: tenantKey,
        userId,
        previousSelection: selectedNav
      });
    }

    // Mark that user has interacted to prevent restoration override
    setHasUserInteracted(true);

    // Always update local state immediately for responsive UI
    setSelectedNav(navOptionId);

    // Persist navigation state (async, non-blocking)
    if (userId && tenantKey) {
      updateNavigationState(navOptionId);
      if (process.env.NODE_ENV === 'development') {
        console.log('[NavPanel] Persisting navigation state:', { tenantKey: tenantKey, navOptionId });
      }
    }

    if (onNavSelect) {
      onNavSelect(navOptionId);
    }
  };

  const handleFooterAction = async (action: string) => {
    if (action === 'signOut') {
      await authService.signOut(supabase);
      window.location.href = '/';
    } else {
      handleNavClick(action);
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] my-4">
        <aside
          className={`h-full flex flex-col justify-center items-center shadow-2xl rounded-2xl bg-white/40 backdrop-blur-xl border border-gray-100 mx-2 transition-all duration-300
            ${isCollapsed ? 'w-14 px-1' : 'w-64 px-3'}
          `}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.7) 60%, rgba(200,220,255,0.3) 100%)",
            boxShadow: "0 12px 32px 0 rgba(60, 60, 60, 0.18)",
          }}
        >
          <div className="animate-pulse text-gray-600">
            {isCollapsed ? "..." : "Loading navigation..."}
          </div>
        </aside>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] my-4">
        <aside
          className={`h-full flex flex-col justify-center items-center shadow-2xl rounded-2xl bg-white/40 backdrop-blur-xl border border-gray-100 mx-2 transition-all duration-300
            ${isCollapsed ? 'w-14 px-1' : 'w-64 px-3'}
          `}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.7) 60%, rgba(200,220,255,0.3) 100%)",
            boxShadow: "0 12px 32px 0 rgba(60, 60, 60, 0.18)",
          }}
        >
          <div className="text-red-500 text-center text-sm">
            {isCollapsed ? "!" : `Navigation Error: ${error}`}
          </div>
        </aside>
      </div>
    );
  }

  // Handle no navigation data
  if (!navSchema) {
    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] my-4">
        <aside
          className={`h-full flex flex-col justify-center items-center shadow-2xl rounded-2xl bg-white/40 backdrop-blur-xl border border-gray-100 mx-2 transition-all duration-300
            ${isCollapsed ? 'w-14 px-1' : 'w-64 px-3'}
          `}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.7) 60%, rgba(200,220,255,0.3) 100%)",
            boxShadow: "0 12px 32px 0 rgba(60, 60, 60, 0.18)",
          }}
        >
          <div className="text-gray-500 text-center text-sm">
            {isCollapsed ? "?" : "No navigation available"}
          </div>
        </aside>
      </div>
    );
  }

  // Split nav items for sticky bottom (position: 'bottom')
  const mainSections = navSchema.props.sections.filter(
    (s) => !s.items.some((i) => i.position === "bottom")
  );

  // Debug: Log navigation items and current selection
  if (process.env.NODE_ENV === 'development') {
    console.log('[NavPanel] Rendering navigation items:', {
      tenantKey: tenantKey,
      selectedNav,
      lastNavOptionId,
      allItems: mainSections.flatMap(s => s.items.map(i => ({ id: i.id, label: i.label }))),
      sectionsCount: mainSections.length
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] my-4">
      <aside
        className={`h-full flex flex-col justify-between shadow-2xl rounded-2xl bg-white/40 backdrop-blur-xl border border-gray-100 mx-2 transition-all duration-300
          ${isCollapsed ? 'w-14 px-1' : 'w-64 px-3'}
        `}
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.7) 60%, rgba(200,220,255,0.3) 100%)",
          boxShadow: "0 12px 32px 0 rgba(60, 60, 60, 0.18)",
        }}
        aria-label="Sidebar navigation"
      >
        {/* Header: Greeting and Avatar */}
        {navSchema.props.header && !isCollapsed && (
          <div className="flex items-center gap-2 px-4 pt-4 pb-2 sticky top-0 z-20 bg-white/60 backdrop-blur rounded-t-2xl border-b border-gray-100">
            <img
              src={avatarUrl || "/icons/default-avatar.svg"}
              alt="User avatar"
              className="rounded-full w-8 h-8 object-cover border border-gray-200 shadow-sm"
            />
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-700 font-medium tracking-wide opacity-80">{navSchema.props.header.greeting}</span>
            </div>
          </div>
        )}

        {/* Context Selector */}
        <div className={`${isCollapsed ? 'px-0 pb-2 pt-2' : 'w-full pb-2 pt-2'}`}>
          <ContextSelector
            contexts={contextOptions}
            value={selectedTenantKey || ""}
            onChange={onContextChange || (() => {})}
            collapsed={isCollapsed}
          />
        </div>

        {/* Scrollable nav */}
        <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-0 py-1' : 'px-1 py-1'} space-y-4 custom-scrollbar`} tabIndex={0} aria-label="Navigation sections">
          {mainSections.map((section, idx) => (
            <div key={section.title || `section-${idx}`} className="mb-0.5">
              {section.title && !isCollapsed && (
                <div className="text-[10px] font-normal uppercase tracking-widest text-gray-400 mb-1 pl-2 select-none">
                  {section.title}
                </div>
              )}
              <nav className={`flex flex-col gap-0.5 mt-0.5 ${isCollapsed ? 'items-center' : ''}`} aria-label={section.title || undefined}>
                {section.items.map((item, itemIdx) => {
                  const isActive = selectedNav === item.id;
                  const iconName = toPascalCase(item.icon || '');
                  const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }> | undefined;
                  const Icon = IconComponent || LucideIcons.FileQuestion;
                  const tooltip = isCollapsed
                    ? item.label + (item.description ? ` — ${item.description}` : "")
                    : undefined;
                  return (
                    <div key={`${idx}-${itemIdx}-${item.id}`} title={isCollapsed ? tooltip : undefined}>
                      <button
                        type="button"
                        onClick={() => handleNavClick(item.id)}
                        className={`flex items-center transition-all duration-150 w-full min-w-0 focus:outline-none ${
                          isCollapsed ? "justify-center px-0 py-2 rounded-full" : "gap-2 px-2 py-1.5 rounded-lg"
                        } ${
                          isActive
                            ? "font-semibold scale-[1.04] shadow"
                            : "hover:scale-[1.03] hover:shadow-md"
                        }`}
                        style={{
                          fontSize: 13,
                          marginBottom: "1px",
                          fontWeight: isActive ? 600 : 400,
                          boxShadow: isActive ? "0 2px 8px 0 rgba(60, 60, 60, 0.08)" : undefined,
                          transform: isActive ? "scale(1.04)" : undefined,
                          transition:
                            "background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.18s",
                          background: isActive
                            ? "rgba(var(--primary-rgb), 0.12)"
                            : undefined,
                          color: isActive
                            ? "var(--primary)"
                            : undefined,
                        }}
                        aria-current={isActive ? "page" : undefined}
                        tabIndex={0}
                        aria-label={item.label}
                        onMouseEnter={e => {
                          if (!isActive) {
                            e.currentTarget.style.background = "rgba(var(--primary-rgb), 0.08)";
                            e.currentTarget.style.color = "var(--primary)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            e.currentTarget.style.background = "";
                            e.currentTarget.style.color = "";
                          }
                        }}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.6} style={{ color: isActive ? "var(--primary)" : "#9ca3af" }} />
                        {!isCollapsed && (
                          <span className="text-[13px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{fontWeight: isActive ? 600 : 400}}>{item.label}</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </nav>
              {/* Section divider */}
              {idx < mainSections.length - 1 && (
                <div className="border-b border-gray-200 my-2" />
              )}
            </div>
          ))}
        </div>

        {/* Sticky footer: profile and actions */}
        {navSchema.props.footer && (
          <div className={`bg-white/70 backdrop-blur-xl rounded-b-2xl border-t border-gray-100 ${isCollapsed ? 'px-1 py-2 mb-3' : 'px-4 py-2 mb-3'} flex flex-col gap-1 shadow-sm`}>
            {navSchema.props.footer.profile && !isCollapsed && (
              <div className="flex items-center gap-2 mb-0.5">
                <img
                  src={avatarUrl}
                  alt="Profile avatar"
                  className="rounded-full w-7 h-7 object-cover border border-gray-200 shadow-sm"
                />
                <span className="text-xs font-normal text-gray-700 opacity-80">{navSchema.props.footer.profile.name}</span>
              </div>
            )}
            <div className={`flex flex-col gap-0.5 ${isCollapsed ? 'items-center' : ''}`}>
              {/* User Profile Button */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className={`flex items-center ${isCollapsed ? 'justify-center px-0 py-2 rounded-full' : 'gap-2 px-0 py-1.5 rounded-lg'} transition-all font-medium focus:outline-none focus:ring-2`}
                style={{
                  color: 'var(--text-secondary)',
                  justifyContent: !isCollapsed ? 'flex-start' : 'center'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = '';
                }}
                tabIndex={0}
                aria-label="User Profile"
              >
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="shrink-0 rounded-full w-4 h-4 object-cover border border-gray-200 shadow-sm mr-1"
                />
                {!isCollapsed && <span className="text-[13px]">My Profile</span>}
              </button>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={() => handleFooterAction('signOut')}
                className={`flex items-center ${isCollapsed ? 'justify-center px-0 py-2 rounded-full' : 'gap-2 px-0 py-1.5 rounded-lg'} transition-all font-medium focus:outline-none focus:ring-2`}
                style={{
                  color: 'var(--text-secondary)',
                  justifyContent: !isCollapsed ? 'flex-start' : 'center'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#dc2626';
                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = '';
                }}
                tabIndex={0}
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4 mr-1 text-gray-400" strokeWidth={1.6} />
                {!isCollapsed && <span className="text-[13px]">Sign Out</span>}
              </button>
            </div>
          </div>
        )}

        {/* Middle right expand/collapse button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="absolute top-1/2 right-0 z-40 rounded-full p-1 bg-white/80 border border-gray-200 shadow-md hover:bg-blue-100 transition"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{ transform: 'translateY(-50%) translateX(50%)' }}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}

        {/* User Profile Modal */}
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => {
            console.log('[NavPanel] Profile modal close requested');
            setIsProfileModalOpen(false);
          }}
          userId={userId || ""}
        />
      </aside>
    </div>
  );
}