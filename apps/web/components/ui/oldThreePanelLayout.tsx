// File: components/ui/ThreePanelLayout.tsx
"use client";

import React, { ReactNode } from "react";
import AIExperience from "../ai/AIExperience";

interface ThreePanelLayoutProps {
  nav: ReactNode;
  content: ReactNode;
  isCollapsed?: boolean;
}

export default function ThreePanelLayout({
  nav,
  content,
  isCollapsed = false,
}: ThreePanelLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Navigation Panel */}
      <div
        className={`transition-all duration-300 ease-in-out flex-shrink-0 ${
          isCollapsed ? "w-[80px]" : "w-[250px]"
        }`}
      >
        {nav}
      </div>

      {/* Main Content Area */}
      <main className="flex-grow min-w-0 overflow-y-auto bg-gray-50">
        {content}
      </main>

      {/* CopilotKit AI Experience (floating button/modal) */}
      <AIExperience />
    </div>
  );
}