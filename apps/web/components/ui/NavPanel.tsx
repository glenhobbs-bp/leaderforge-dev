// File: apps/web/components/ui/NavPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, BookOpen, Library, Target, Users, LayoutDashboard, Settings, LogOut, HelpCircle, Bug, FileQuestion, BarChart, Diamond, Handshake, User as UserIcon, Cog } from "lucide-react";
import { useTheme } from "./ThemeContext";
import ContextSelector from "./ContextSelector";
import { ComponentSchemaRenderer } from "../ai/ComponentSchemaRenderer";
import { useSupabaseClient } from '@supabase/auth-helpers-react';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
  description?: string;
}

interface Theme {
  panelBg: string;
  panelText: string;
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveText: string;
  inactiveBorder: string;
}

interface Logo {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

interface Icon {
  src: string;
  alt: string;
  size?: number;
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
}

// Toggle for demo: set to 'solid' or 'translucent'
const UNSELECTED_BG_MODE: "solid" | "translucent" = "solid"; // change to 'translucent' to demo

// Map schema icon keys to Lucide icon components
const iconMap: Record<string, React.ComponentType<any>> = {
  book: BookOpen,
  library: Library,
  target: Target,
  users: Users,
  dashboard: LayoutDashboard,
  settings: Settings,
  logout: LogOut,
  help: HelpCircle,
  bug: Bug,
  file: FileQuestion,
  'bar-chart': BarChart,
  diamond: Diamond,
  handshake: Handshake,
  user: UserIcon,
  cog: Cog,
};

export default function NavPanel({
  navSchema,
  contextOptions = [],
  contextValue,
  onContextChange,
  onNavSelect,
  isCollapsed = false,
  onToggleCollapse,
}: NavPanelProps) {
  const theme = useTheme().nav;
  const [selectedNav, setSelectedNav] = useState<string | null>(null);
  // Hard-coded userId for now
  const userId = "123e4567-e89b-12d3-a456-426614174000";
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!userId) {
      setAvatarUrl(null);
      return;
    }
    fetch(`/api/user/avatar?userId=${userId}`)
      .then(res => res.json())
      .then(data => setAvatarUrl(data.url || "/icons/default-avatar.svg"))
      .catch(() => setAvatarUrl("/icons/default-avatar.svg"));
  }, [userId]);

  const handleNavClick = (navOptionId: string) => {
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
  const bottomSection = navSchema.props.sections.find(
    (s) => s.items.some((i) => i.position === "bottom")
  );
  const bottomItems = bottomSection ? bottomSection.items.filter((i) => i.position === "bottom") : [];

  return (
    <div className="flex h-full flex-col">
      <aside
        className="h-full flex flex-col transition-all duration-300 relative shadow-lg bg-[var(--bg-light)]"
        style={{
          background:
            "linear-gradient(135deg, var(--bg-light) 60%, var(--bg-gradient) 100%)",
          boxShadow: "0 4px 24px 0 rgba(60, 60, 60, 0.04)",
        }}
        aria-label="Sidebar navigation"
      >
        {/* Header: Greeting and Avatar */}
        {navSchema.props.header && !isCollapsed && (
          <div className="flex items-center gap-2 px-4 pt-4 pb-2 sticky top-0 z-20 bg-[var(--bg-light)]/80 backdrop-blur border-b border-[var(--bg-neutral)]">
            <img
              src={avatarUrl || "/icons/default-avatar.svg"}
              alt="User avatar"
              className="rounded-full w-8 h-8 object-cover border border-[var(--accent)]"
            />
            <div className="flex flex-col">
              <span className="text-xs text-[var(--primary)] font-semibold">{navSchema.props.header.greeting}</span>
            </div>
          </div>
        )}
        {/* Context Selector */}
        <div className="px-2 pb-2 pt-2">
          <ContextSelector
            contexts={contextOptions}
            value={contextValue || ""}
            onChange={onContextChange || (() => {})}
            collapsed={isCollapsed}
          />
        </div>
        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 custom-scrollbar" tabIndex={0} aria-label="Navigation sections">
          {mainSections.map((section, idx) => (
            <div key={idx} className="mb-1">
              {section.title && !isCollapsed && (
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] mt-4 mb-1 opacity-70">
                  {section.title}
                </div>
              )}
              <nav className="flex flex-col gap-1 mt-1" aria-label={section.title || undefined}>
                {section.items.map((item) => {
                  const isActive = selectedNav === item.id;
                  const Icon = iconMap[(item.icon || '').replace('.svg', '').replace(/\//g, '').replace('-', '').toLowerCase()] || FileQuestion;
                  const tooltip = isCollapsed
                    ? item.label + (item.description ? ` — ${item.description}` : "")
                    : undefined;
                  return (
                    <div key={item.id} {...(isCollapsed ? { title: tooltip } : {})}>
                      <button
                        type="button"
                        onClick={() => handleNavClick(item.id)}
                        className={[
                          "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 border-l-4 w-full min-w-0 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
                          isActive
                            ? "bg-[var(--accent)]/10 border-l-[var(--accent)] text-[var(--primary)] shadow animate-[slideIn_0.2s]"
                            : "border-l-transparent hover:bg-[var(--accent)]/5 hover:text-[var(--primary)]",
                          isCollapsed ? "justify-center" : "",
                        ].join(" ")}
                        style={{
                          fontSize: 14,
                          borderRadius: "10px",
                          marginBottom: "2px",
                          transition:
                            "background 0.2s, border-color 0.2s, box-shadow 0.2s, color 0.2s",
                        }}
                        aria-current={isActive ? "page" : undefined}
                        tabIndex={0}
                        aria-label={item.label}
                      >
                        <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                        {!isCollapsed && (
                          <span className="text-sm leading-tight">{item.label}</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </nav>
              {/* Section divider */}
              {idx < mainSections.length - 1 && (
                <div className="border-b border-[var(--bg-neutral)] my-2" />
              )}
            </div>
          ))}
        </div>
        {/* Sticky footer: profile and actions */}
        {navSchema.props.footer && (
          <div className="sticky bottom-0 z-30 bg-[var(--bg-light)]/95 backdrop-blur border-t border-[var(--bg-neutral)] px-4 py-2 flex flex-col gap-2">
            {navSchema.props.footer.profile && !isCollapsed && (
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={avatarUrl || "/icons/default-avatar.svg"}
                  alt="Profile avatar"
                  className="rounded-full w-6 h-6 object-cover border border-[var(--accent)]"
                />
                <span className="text-sm font-medium text-[var(--primary)]">{navSchema.props.footer.profile.name}</span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              {navSchema.props.footer.actions?.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => handleFooterAction(action.action)}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-[var(--primary)] hover:bg-[var(--accent)]/10 transition-all font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  tabIndex={0}
                  aria-label={action.label}
                >
                  {action.icon && (
                    <img
                      src={action.icon}
                      alt={action.label}
                      width={16}
                      height={16}
                      className="shrink-0"
                      onError={e => (e.currentTarget.src = "/icons/placeholder.png")}
                    />
                  )}
                  {!isCollapsed && <span>{action.label}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Middle right expand/collapse button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="absolute top-1/2 right-0 z-40 rounded-full p-0.5 bg-[var(--bg-neutral)] hover:bg-[var(--accent)] border border-gray-200 shadow transition"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{ transform: 'translateY(-50%) translateX(50%)' }}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </aside>
      {/* Custom scrollbar styles and micro-interaction keyframes */}
      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--accent) var(--bg-neutral);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--accent);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--bg-neutral);
        }
        @keyframes slideIn {
          from { border-left-width: 0; opacity: 0.7; }
          to { border-left-width: 4px; opacity: 1; }
        }
      `}</style>
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
