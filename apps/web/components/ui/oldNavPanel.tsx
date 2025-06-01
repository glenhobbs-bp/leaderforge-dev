// File: apps/web/components/ui/NavPanel.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  theme: Theme;
  logo?: Logo;
  icon?: Icon;
  contextTitle?: string;
  contextSubtitle?: string;
}

export default function NavPanel({
  items,
  selected,
  onSelect,
  theme,
  logo,
  icon,
  contextTitle,
  contextSubtitle,
}: NavPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  return (
    <aside
      className={`h-full flex flex-col justify-between transition-all duration-300 ${theme.panelBg} ${
        isCollapsed ? "w-[80px]" : "w-[280px]"
      }`}
      onMouseEnter={() => isCollapsed && setIsCollapsed(false)}
      onMouseLeave={() => !isCollapsed && setIsCollapsed(true)}
    >
      <div className="px-4 py-6 space-y-6">
        {/* Logo and Context Info */}
        <div className="flex flex-col items-center text-center space-y-2">
          {logo && !isCollapsed && (
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width || 120}
              height={logo.height || 40}
              priority
            />
          )}
          {icon && isCollapsed && (
            <Image
              src={icon.src}
              alt={icon.alt}
              width={icon.size || 32}
              height={icon.size || 32}
              priority
            />
          )}
          {!isCollapsed && contextTitle && (
            <div className="text-sm font-semibold text-gray-900">{contextTitle}</div>
          )}
          {!isCollapsed && contextSubtitle && (
            <div className="text-xs text-gray-500">{contextSubtitle}</div>
          )}
        </div>

        {/* Toggle Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleCollapse}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Section title */}
        {!isCollapsed && (
          <div className={`text-xs font-semibold uppercase tracking-widest ${theme.panelText}`}>
            Sections
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex flex-col gap-3 mt-2">
          {items.map((item) => {
            const isActive = selected?.href === item.href;
            const iconSrc = item.icon || "/icons/default.svg";
            return (
              <button
                key={item.href}
                onClick={() => onSelect?.(item)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-150 ${
                  isActive
                    ? `border-l-4 border-green-500 ${theme.activeBg} ${theme.activeText} font-semibold`
                    : `${theme.inactiveBg} ${theme.inactiveText} ${theme.inactiveBorder} hover:border-yellow-400 hover:bg-yellow-50 font-medium`
                }`}
                style={{ fontSize: 14, justifyContent: isCollapsed ? "center" : "flex-start" }}
              >
                <Image src={iconSrc} alt={item.label} width={20} height={20} />
                {!isCollapsed && (
                  <div className="flex flex-col items-start">
                    <span className="text-sm">{item.label}</span>
                    {item.description && <span className="text-xs text-gray-400">{item.description}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}