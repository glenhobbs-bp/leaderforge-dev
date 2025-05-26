// ThreePanelLayout.tsx

import React from "react";

interface ThreePanelLayoutProps {
  nav: React.ReactNode;
  content: React.ReactNode;
  chat: React.ReactNode;
}

export default function ThreePanelLayout({
  nav,
  content,
  chat,
}: ThreePanelLayoutProps) {
  return (
    <div className="grid grid-cols-12 h-screen">
      <aside className="col-span-2 bg-white border-r border-gray-200 overflow-auto">
        {nav}
      </aside>
      <main className="col-span-8 bg-gray-50 overflow-auto">
        {content}
      </main>
      <aside className="col-span-2 bg-white border-l border-gray-200 overflow-auto">
        {chat}
      </aside>
    </div>
  );
}