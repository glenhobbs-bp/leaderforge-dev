// File: components/ui/ThreePanelLayout.tsx
"use client";

import React, { ReactNode, useState } from "react";
import { ThemeProvider } from "@/components/ui/ThemeContext";
import AIExperience from "../ai/AIExperience";

interface ThreePanelLayoutProps {
  nav: ReactNode;
  content: ReactNode;
  chat?: ReactNode;
  contextConfig: any;
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
            {React.isValidElement(nav)
              ? React.cloneElement(nav, {
                  isCollapsed,
                  onToggleCollapse: () => setIsCollapsed((prev) => !prev),
                })
              : nav}
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
