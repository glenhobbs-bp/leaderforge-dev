// File: apps/web/components/DynamicModulePage.tsx
"use client";

import { useState } from "react";
import ThreePanelLayout from "@/components/ui/ThreePanelLayout";
import NavPanel from "@/components/ui/NavPanel";
import ContentPanel from "@/components/ui/ContentPanel";
import ChatPanel from "@/components/ui/ChatPanel";

export default function DynamicModulePage({ config }) {
  const [selectedItem, setSelectedItem] = useState(config.nav[0]);

  const renderContent = () => {
    switch (selectedItem.href) {
      case "/dashboard":
        return <ContentPanel heading="Dashboard" description="Welcome to your dashboard." />;
      case "/library":
        return <ContentPanel heading="Library" description="Explore the Brilliant+ Library." />;
      case "/settings":
        return <ContentPanel heading="Settings" description="Manage your preferences." />;
      default:
        return <ContentPanel heading={config.content.heading} description={config.content.description} />;
    }
  };

  return (
    <ThreePanelLayout
      nav={<NavPanel items={config.nav} onSelect={setSelectedItem} selected={selectedItem} />}
      content={renderContent()}
      chat={<ChatPanel heading={config.chat.heading} message={config.chat.message} />}
    />
  );
}