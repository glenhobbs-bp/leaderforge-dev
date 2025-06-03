// File: apps/web/components/ui/NavPanel.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "./ThemeContext";
import ContextSelector from "./ContextSelector";
import { ComponentSchemaRenderer } from "../ai/ComponentSchemaRenderer";

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

interface NavPanelProps {
  navOptions?: NavItem[];
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

export default function NavPanel({
  navOptions = [],
  contextOptions = [],
  contextValue,
  onContextChange,
  onNavSelect,
  isCollapsed = false,
  onToggleCollapse,
}: NavPanelProps) {
  const theme = useTheme().nav;
  const [selectedNav, setSelectedNav] = useState<string | null>(null);

  const handleNavClick = (navOptionId: string) => {
    setSelectedNav(navOptionId);
    if (onNavSelect) {
      onNavSelect(navOptionId);
    }
  };

  // Helper to get logo src, title, and subtitle for current context
  const getContextMeta = () => {
    if (!contextValue) return {};
    if (contextValue === "brilliant-movement") {
      return {
        logo: "/logos/brilliant-icon.png",
        title: "Brilliant Movement",
        subtitle: "Kingdom Activation",
      };
    }
    if (contextValue === "leaderforge-business") {
      return {
        logo: "/logos/leaderforge-icon.png",
        title: "LeaderForge",
        subtitle: "Turning Potential into Performance",
      };
    }
    return {};
  };
  const { logo, title, subtitle } = getContextMeta();

  return (
    <div className="flex h-full flex-col">
      <aside
        className="h-full flex flex-col transition-all duration-300 relative shadow-lg"
        style={{
          background:
            "linear-gradient(135deg, var(--bg-light) 60%, var(--bg-gradient) 100%)",
          boxShadow: "0 4px 24px 0 rgba(60, 60, 60, 0.04)",
        }}
      >
        {/* Top row: collapse/expand button right-aligned */}
        <div className="flex items-center justify-end px-2 pt-2 pb-0">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded-full p-2 bg-[var(--bg-neutral)] hover:bg-[var(--accent)] transition"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          )}
        </div>
        {/* ContextSelector always below button, handles collapsed/expanded rendering */}
        <div className="px-2 pb-2">
          <ContextSelector
            contexts={contextOptions}
            value={contextValue || ""}
            onChange={onContextChange || (() => {})}
            collapsed={isCollapsed}
          />
        </div>
        <div className="px-4 py-2 space-y-6 flex-1 flex flex-col">
          {/* Section title */}
          {!isCollapsed && (
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
              Sections
            </div>
          )}
          {/* Navigation Items */}
          <nav className="flex flex-col gap-4 mt-2">
            {navOptions.map((item: any) => {
              const isActive = selectedNav === item.id;
              const iconSrc = item.icon || "/icons/default.svg";
              const tooltip = isCollapsed
                ? item.label + (item.description ? ` — ${item.description}` : "")
                : undefined;
              return (
                <div key={item.id} {...(isCollapsed ? { title: tooltip } : {})}>
                  <button
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={[
                      "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-150 border-l-4 w-full min-w-0",
                      isActive ? "shadow-md font-semibold" : "font-medium",
                      isCollapsed ? "justify-center" : "",
                    ].join(" ")}
                    style={{
                      fontSize: 15,
                      justifyContent: isCollapsed ? "center" : "flex-start",
                      boxShadow: isActive
                        ? "0 4px 16px 0 rgba(60,60,60,0.06)"
                        : undefined,
                      borderLeftColor: isActive ? "var(--accent)" : "transparent",
                      background: isActive
                        ? "var(--bg-neutral)"
                        : UNSELECTED_BG_MODE === "solid"
                        ? "var(--bg-neutral)"
                        : "rgba(232, 244, 248, 0.5)",
                      color: isActive ? "var(--primary)" : "var(--text-primary)",
                      borderRadius: "16px",
                      marginBottom: "4px",
                      transition:
                        "background 0.2s, border-color 0.2s, box-shadow 0.2s",
                    }}
                  >
                    <img
                      src={iconSrc}
                      alt={item.label}
                      width={20}
                      height={20}
                      onError={e => (e.currentTarget.src = "/icons/placeholder.png")}
                    />
                    {!isCollapsed && (
                      <div className="flex flex-col items-start">
                        <span className="text-sm">{item.label}</span>
                        {item.description && (
                          <span className="text-xs opacity-70">
                            {item.description}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </div>
  );
}
