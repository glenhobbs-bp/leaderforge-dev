"use client";

// File: components/ui/ThreePanelLayout.tsx
// Purpose: Three-panel layout component with theme context and collapsible navigation
// Owner: Frontend team
// Tags: UI, layout, theme, React, client component

import React, { ReactElement, useState } from "react";
import { ThemeProvider } from "./ThemeContext";
import AIExperience from "../ai/AIExperience";

interface ContextConfig {
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    bg_light: string;
    bg_neutral: string;
    text_primary: string;
    bg_gradient: string;
  };
}

interface ThreePanelLayoutProps {
  nav: ReactElement;
  content: React.ReactNode;
  chat?: React.ReactNode;
  contextConfig: ContextConfig;
}

export default function ThreePanelLayout({
  nav,
  content,
  chat,
  contextConfig,
}: ThreePanelLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <ThemeProvider value={contextConfig.theme}>
      <div
        style={
          {
            "--primary": contextConfig.theme.primary,
            "--secondary": contextConfig.theme.secondary,
            "--accent": contextConfig.theme.accent,
            "--bg-light": contextConfig.theme.bg_light,
            "--bg-neutral": contextConfig.theme.bg_neutral,
            "--text-primary": contextConfig.theme.text_primary,
            "--bg-gradient": contextConfig.theme.bg_gradient,
            "--card-bg": contextConfig.theme.bg_light, // Use bg_light for card backgrounds
            background: "var(--bg-light)",
          } as React.CSSProperties
        }
        className="h-screen w-full"
      >
        <div className="flex h-screen w-full overflow-hidden">
          {/* NavPanel: only as wide as needed, no parent background */}
          <div
            className="flex-shrink-0 transition-all duration-300 ease-in-out"
            style={{ width: isCollapsed ? 80 : 280 }}
          >
            {React.cloneElement(nav, {
              isCollapsed,
              onToggleCollapse: () => setIsCollapsed((prev) => !prev),
            })}
          </div>
          {/* ContentPanel: always fills available space */}
          <main className="flex-grow min-w-0 overflow-y-auto">{content}</main>
          {chat && (
            <aside className="w-[300px] flex-shrink-0 border-l border-gray-200 overflow-y-auto">
              {chat}
            </aside>
          )}
        </div>
      </div>
      <AIExperience />
    </ThemeProvider>
  );
}
