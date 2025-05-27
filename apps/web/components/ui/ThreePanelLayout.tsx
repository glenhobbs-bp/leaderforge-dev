// File: components/ui/ThreePanelLayout.tsx
"use client";

import React, { ReactNode } from "react";

interface ThreePanelLayoutProps {
  nav: ReactNode;
  content: ReactNode;
  chat?: ReactNode;
  isCollapsed?: boolean;
}

export default function ThreePanelLayout({
  nav,
  content,
  chat,
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

      {/* Optional Chat Panel */}
      {chat && (
        <aside className="w-[300px] flex-shrink-0 border-l border-gray-200 overflow-y-auto">
          {chat}
        </aside>
      )}
    </div>
  );
}