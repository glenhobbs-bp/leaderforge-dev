// File: apps/web/components/ui/NavPanel.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeContext";
import ContextSelector from "@/components/ui/ContextSelector";

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
  items: NavItem[];
  selected?: NavItem;
  onSelect?: (item: NavItem) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  contextOptions?: { id: string; title: string; subtitle?: string; icon?: string }[];
  contextValue?: string;
  onContextChange?: (id: string) => void;
}

// Toggle for demo: set to 'solid' or 'translucent'
const UNSELECTED_BG_MODE: 'solid' | 'translucent' = 'solid'; // change to 'translucent' to demo

export default function NavPanel({
  items,
  selected,
  onSelect,
  isCollapsed = false,
  onToggleCollapse,
  contextOptions = [],
  contextValue,
  onContextChange,
}: NavPanelProps) {
  const theme = useTheme().nav;

  return (
    <aside
      className="h-full flex flex-col transition-all duration-300 relative shadow-lg"
      style={{
        background: "linear-gradient(135deg, var(--bg-light) 60%, var(--bg-gradient) 100%)",
        boxShadow: "0 4px 24px 0 rgba(60, 60, 60, 0.04)",
      }}
    >
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Context selector and chevron button */}
        <div className="flex items-center justify-between px-0 pt-2 pb-2">
          <div className="flex-1">
            <ContextSelector
              contexts={contextOptions}
              value={contextValue || ""}
              onChange={onContextChange || (() => {})}
              collapsed={isCollapsed}
            />
          </div>
          <button
            onClick={onToggleCollapse}
            className="ml-2 rounded-full p-1 hover:bg-gray-200 transition"
            aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        <div className="px-4 py-2 space-y-6">
          {/* Section title */}
          {!isCollapsed && (
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
              Sections
            </div>
          )}
          {/* Navigation Items */}
          <nav className="flex flex-col gap-4 mt-2">
            {items.map((item) => {
              const isActive = selected?.href === item.href;
              const iconSrc = item.icon || "/icons/default.svg";
              return (
                <button
                  key={item.href}
                  onClick={() => onSelect?.(item)}
                  className={
                    [
                      "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-150 border-l-4",
                      isActive ? "shadow-md font-semibold" : "font-medium",
                    ].join(" ")
                  }
                  style={{
                    fontSize: 15,
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    boxShadow: isActive ? "0 4px 16px 0 rgba(60,60,60,0.06)" : undefined,
                    borderLeftColor: isActive ? "var(--accent)" : "transparent",
                    background: isActive
                      ? "var(--bg-neutral)"
                      : UNSELECTED_BG_MODE === 'solid'
                        ? "var(--bg-neutral)"
                        : "rgba(232, 244, 248, 0.5)", // translucent leaderforge neutral (e8f4f8)
                    color: isActive ? "var(--primary)" : "var(--text-primary)",
                    borderRadius: "16px",
                    marginBottom: "4px",
                    transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = UNSELECTED_BG_MODE === 'solid'
                        ? "var(--bg-neutral)"
                        : "rgba(232, 244, 248, 0.8)";
                      e.currentTarget.style.borderLeftColor = "var(--secondary)";
                      e.currentTarget.style.boxShadow = "0 2px 8px 0 rgba(60,60,60,0.04)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = UNSELECTED_BG_MODE === 'solid'
                        ? "var(--bg-neutral)"
                        : "rgba(232, 244, 248, 0.5)";
                      e.currentTarget.style.borderLeftColor = "transparent";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  <Image src={iconSrc} alt={item.label} width={20} height={20} />
                  {!isCollapsed && (
                    <div className="flex flex-col items-start">
                      <span className="text-sm">{item.label}</span>
                      {item.description && <span className="text-xs opacity-70">{item.description}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}