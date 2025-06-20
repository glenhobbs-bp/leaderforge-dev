// File: apps/web/components/ui/NavPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import ContextSelector from "./ContextSelector";
import { useSupabase } from '../SupabaseProvider';
import { useNavigation } from '@/hooks/useNavigation';
import { authService } from '@/app/lib/authService';
import * as LucideIcons from "lucide-react";
import { useNavigation } from '@/hooks/useNavigation';

// Global avatar cache to persist across component remounts
const globalAvatarCache = new Map<string, string>();

// Convert kebab-case to PascalCase for Lucide icons
function toPascalCase(str: string) {
  return str
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

// Add NavPanelSchema type
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
  navSchema: NavPanelSchema;
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

export default function NavPanel({
  navSchema,
  contextOptions = [],
  contextValue,
  onContextChange,
  onNavSelect,
  isCollapsed = false,
  onToggleCollapse,
  userId,
}: NavPanelProps) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[NavPanel] RENDER');
  }
  const [selectedNav, setSelectedNav] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState<boolean>(false);
  const { supabase } = useSupabase();

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
      await supabase.auth.signOut();
      await fetch('/api/auth/set-session', {
        method: 'POST',
        body: JSON.stringify({ session: null }),
        headers: { 'Content-Type': 'application/json' },
      });
      window.location.href = '/';
    } else {
      handleNavClick(action);
    }
  };

  // Split nav items for sticky bottom (position: 'bottom')
  const mainSections = navSchema.props.sections.filter(
    (s) => !s.items.some((i) => i.position === "bottom")
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
            value={contextValue || ""}
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
                  const Icon = (LucideIcons as Record<string, any>)[iconName] || LucideIcons.FileQuestion;
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
                            ? "rgba(var(--primary-rgb, 59,130,246), 0.12)"
                            : undefined,
                          color: isActive
                            ? "var(--primary, #2563eb)"
                            : undefined,
                        }}
                        aria-current={isActive ? "page" : undefined}
                        tabIndex={0}
                        aria-label={item.label}
                        onMouseEnter={e => {
                          if (!isActive) {
                            e.currentTarget.style.background = "rgba(var(--primary-rgb, 59,130,246), 0.08)";
                            e.currentTarget.style.color = "var(--primary, #2563eb)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            e.currentTarget.style.background = "";
                            e.currentTarget.style.color = "";
                          }
                        }}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.6} style={{ color: isActive ? "var(--primary, #2563eb)" : "#9ca3af" }} />
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
                  src={avatarUrl || "/icons/default-avatar.svg"}
                  alt="Profile avatar"
                  className="rounded-full w-6 h-6 object-cover border border-gray-200 shadow-sm"
                />
                <span className="text-xs font-normal text-gray-700 opacity-80">{navSchema.props.footer.profile.name}</span>
              </div>
            )}
            <div className={`flex flex-col gap-0.5 ${isCollapsed ? 'items-center' : ''}`}>
              {navSchema.props.footer.actions?.map((action) => {
                const isSignOut = action.action === 'signOut';
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleFooterAction(action.action)}
                    className={`flex items-center ${isCollapsed ? 'justify-center px-0 py-2 rounded-full' : 'gap-2 px-0 py-1.5 rounded-lg'} text-gray-600 hover:bg-blue-50/80 hover:text-blue-700 transition-all font-medium focus:outline-none focus:ring-2 focus:ring-blue-300`}
                    tabIndex={0}
                    aria-label={action.label}
                    style={!isCollapsed ? { justifyContent: 'flex-start' } : {}}
                  >
                    {isSignOut ? (
                      <LogOut className="w-4 h-4 mr-1 text-gray-400" strokeWidth={1.6} />
                    ) : action.icon ? (
                      <img
                        src={action.icon}
                        alt={action.label}
                        width={14}
                        height={14}
                        className="shrink-0 opacity-70"
                        onError={e => (e.currentTarget.src = "/icons/placeholder.png")}
                      />
                    ) : null}
                    {!isCollapsed && <span className="text-[13px]">{action.label}</span>}
                  </button>
                );
              })}
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
      </aside>

    </div>
  );
}

// Sample schema for testing
export const sampleNavSchema: NavPanelSchema = {
  type: "NavPanel",
  props: {
    header: {
      greeting: "Welcome back, Glen!",
      avatarUrl: null, // No avatar set, will fallback to default
    },
    sections: [
      {
        title: "LEARNING",
        items: [
          { id: "my-learning", label: "My Learning", icon: "book", href: "/learning" },
          { id: "training-library", label: "Training Library", icon: "library", href: "/library" },
          { id: "bold-actions", label: "Bold Actions", icon: "target", href: "/actions" },
        ],
      },
      {
        title: "OVERVIEW",
        items: [
          { id: "my-team", label: "My Team", icon: "users", href: "/team" },
          { id: "executive-dashboard", label: "Executive Dashboard", icon: "dashboard", href: "/dashboard" },
        ],
      },
      {
        title: "COMPANY",
        items: [
          { id: "company-settings", label: "Company Settings", icon: "settings", href: "/company" },
        ],
      },
      {
        title: "ACCOUNT",
        items: [
          { id: "account-settings", label: "Account Settings", icon: "settings", href: "/account" },
          { id: "onboarding-guide", label: "Onboarding Guide", icon: "help", href: "/onboarding" },
          { id: "report-bug", label: "Report a Bug", icon: "bug", href: "/bug" },
        ],
      },
      {
        title: null,
        items: [
          { id: "sign-out", label: "Sign Out", icon: "logout", position: "bottom" },
        ],
      },
    ],
    footer: {
      profile: { name: "Glen", avatarUrl: null },
      actions: [
        { label: "Sign Out", action: "signOut", icon: "logout" },
      ],
    },
  },
};
