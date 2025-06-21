"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import ContextSelector from "./ContextSelector";
import { useSupabase } from '../SupabaseProvider';
import { useNavigation } from '../../hooks/useNavigation';
import { authService } from '../../app/lib/authService';
import * as LucideIcons from "lucide-react";

// Global avatar cache to persist across component remounts
const globalAvatarCache = new Map<string, string>();

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
  contextKey: string; // Database-driven: context key for navigation query
  contextOptions?: {
    id: string;
    title: string;
    subtitle?: string;
    icon?: string;
  }[];
  contextValue?: string;
  onContextChange?: (id: string) => void;
  onNavSelect?: (navOptionId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  userId?: string | null;
}

export default function NavPanelDatabaseDriven({
  contextKey,
  contextOptions = [],
  contextValue,
  onContextChange,
  onNavSelect,
  isCollapsed = false,
  onToggleCollapse,
  userId,
}: NavPanelProps) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[NavPanel] RENDER - Database-driven with contextKey:', contextKey);
  }

  const [selectedNav, setSelectedNav] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState<boolean>(false);
  const { supabase } = useSupabase();

  // Database-driven navigation
  const { navSchema, loading: navLoading, error: navError } = useNavigation(contextKey);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[NavPanel] useEffect: userId changed to:', userId);
    }

    // Reset avatar if no userId
    if (!userId) {
      setAvatarUrl(null);
      setIsLoadingAvatar(false);
      return;
    }

    // Check global cache first for this specific user
    const cachedUrl = globalAvatarCache.get(userId);
    if (cachedUrl) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NavPanel] Using cached avatar URL for user:', userId);
      }
      setAvatarUrl(cachedUrl);
      return;
    }

    // Check if we're already loading this specific user to prevent duplicate API calls
    const loadingKey = `loading_${userId}`;
    if (globalAvatarCache.has(loadingKey)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NavPanel] Avatar already being fetched for user:', userId);
      }
      return;
    }

    // Mark as loading to prevent duplicate requests
    globalAvatarCache.set(loadingKey, 'true');
    setIsLoadingAvatar(true);

    if (process.env.NODE_ENV === 'development') {
      console.log('[NavPanel] Fetching avatar for userId:', userId);
    }

    fetch(`/api/user/avatar?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        const url = data.url || "/icons/default-avatar.svg";
        if (process.env.NODE_ENV === 'development') {
          console.log('[NavPanel] Avatar API response:', data);
        }

        // Cache the result globally for this user
        globalAvatarCache.set(userId, url);
        setAvatarUrl(url);
      })
      .catch((err) => {
        console.error('[NavPanel] Avatar API error:', err);
        const defaultUrl = "/icons/default-avatar.svg";
        globalAvatarCache.set(userId, defaultUrl);
        setAvatarUrl(defaultUrl);
      })
      .finally(() => {
        // Remove loading flag
        globalAvatarCache.delete(loadingKey);
        setIsLoadingAvatar(false);
      });
  }, [userId]); // Only depend on userId to prevent cycles

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[NavPanel] navSchema changed:', navSchema);
    }
  }, [navSchema]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[NavPanel] contextValue changed:', contextValue);
    }
  }, [contextValue]);

  const handleNavClick = (navOptionId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[NavPanel] handleNavClick:', navOptionId);
    }
    setSelectedNav(navOptionId);
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
  if (navLoading) {
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
  if (navError) {
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
            {isCollapsed ? "!" : `Navigation Error: ${navError}`}
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

  const bottomSections = navSchema.props.sections.filter(
    (s) => s.items.some((i) => i.position === "bottom")
  );

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
        {/* Top Section */}
        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className="flex items-center justify-between py-4">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                {(navSchema.props.header?.avatarUrl || avatarUrl) && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
                    <img
                      src={navSchema.props.header?.avatarUrl || avatarUrl || "/icons/default-avatar.svg"}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/icons/default-avatar.svg";
                      }}
                    />
                  </div>
                )}
                {navSchema.props.header?.greeting && (
                  <span className="text-sm font-medium text-gray-700">
                    {navSchema.props.header.greeting}
                  </span>
                )}
              </div>
            )}

            {/* Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>

          {/* Context Selector */}
          {!isCollapsed && contextOptions.length > 0 && (
            <div className="mb-4">
              <ContextSelector
                options={contextOptions}
                value={contextValue}
                onChange={onContextChange}
              />
            </div>
          )}

          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto">
            <nav className="space-y-1">
              {mainSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mb-6">
                  {!isCollapsed && section.title && (
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                      {section.title}
                    </h3>
                  )}

                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const IconComponent = item.icon ? (LucideIcons as any)[toPascalCase(item.icon)] : null;
                      const isSelected = selectedNav === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`w-full flex items-center space-x-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                            ${isSelected
                              ? 'bg-white/80 text-blue-700 shadow-sm'
                              : 'text-gray-700 hover:bg-white/50 hover:text-gray-900'
                            }
                            ${isCollapsed ? 'justify-center' : 'justify-start'}
                          `}
                          title={isCollapsed ? item.label : undefined}
                        >
                          {IconComponent && (
                            <IconComponent className={`w-4 h-4 ${isSelected ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'}`} />
                          )}
                          {!isCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        {(bottomSections.length > 0 || navSchema.props.footer) && (
          <div className="border-t border-gray-200/50 pt-4">
            {/* Bottom Navigation Items */}
            {bottomSections.map((section, sectionIndex) => (
              <div key={`bottom-${sectionIndex}`} className="mb-2">
                {section.items.map((item) => {
                  const IconComponent = item.icon ? (LucideIcons as any)[toPascalCase(item.icon)] : null;
                  const isSelected = selectedNav === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center space-x-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                        ${isSelected
                          ? 'bg-white/80 text-blue-700 shadow-sm'
                          : 'text-gray-700 hover:bg-white/50 hover:text-gray-900'
                        }
                        ${isCollapsed ? 'justify-center' : 'justify-start'}
                      `}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {IconComponent && (
                        <IconComponent className={`w-4 h-4 ${isSelected ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'}`} />
                      )}
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Footer Actions */}
            {navSchema.props.footer?.actions && (
              <div className="space-y-1">
                {navSchema.props.footer.actions.map((action, actionIndex) => {
                  const IconComponent = action.icon ? (LucideIcons as any)[toPascalCase(action.icon)] || LogOut : LogOut;

                  return (
                    <button
                      key={actionIndex}
                      onClick={() => handleFooterAction(action.action)}
                      className={`w-full flex items-center space-x-3 px-2 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-white/50 hover:text-gray-900 transition-all duration-200 group
                        ${isCollapsed ? 'justify-center' : 'justify-start'}
                      `}
                      title={isCollapsed ? action.label : undefined}
                    >
                      <IconComponent className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                      {!isCollapsed && (
                        <span className="truncate">{action.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}