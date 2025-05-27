// File: apps/web/components/DynamicContextPage.tsx
"use client";

import { useState } from "react";
import ThreePanelLayout from "@/components/ui/ThreePanelLayout";
import NavPanel from "@/components/ui/NavPanel";
import ContentPanel from "@/components/ui/ContentPanel";
import ChatPanel from "@/components/ui/ChatPanel";

interface NavItem {
  label: string;
  href: string;
  icon: string;
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

interface ContextConfig {
  context_id: string;
  context_title?: string;
  context_subtitle?: string;
  logo?: Logo;
  icon?: Icon;
  theme: {
    nav: Theme;
  };
  nav: NavItem[];
  content: {
    heading: string;
    description: string;
  };
  chat: {
    heading: string;
    message: string;
  };
}

export default function DynamicContextPage({ config }: { config: ContextConfig }) {
  const [selectedItem, setSelectedItem] = useState<NavItem>(config.nav[0]);

  const renderContent = () => {
    switch (selectedItem.href) {
      case "/dashboard":
        return (
          <ContentPanel
            heading="Dashboard"
            description="Welcome to your dashboard."
          />
        );
      case "/library":
        return (
          <ContentPanel
            heading="Library"
            description="Explore the Brilliant+ Library."
          />
        );
      case "/settings":
        return (
          <ContentPanel
            heading="Settings"
            description="Manage your preferences."
          />
        );
      default:
        return (
          <ContentPanel
            heading={config.content.heading}
            description={config.content.description}
          />
        );
    }
  };

  return (
    <ThreePanelLayout
      nav={
        <NavPanel
          items={config.nav}
          onSelect={setSelectedItem}
          selected={selectedItem}
          theme={config.theme.nav}
          logo={config.logo}
          icon={config.icon}
          contextTitle={config.context_title}
          contextSubtitle={config.context_subtitle}
        />
      }
      content={renderContent()}
      chat={
        config.chat ? (
          <ChatPanel
            heading={config.chat.heading}
            message={config.chat.message}
          />
        ) : (
          <ChatPanel
            heading="Assistant"
            message="I'm here to help you navigate this experience."
          />
        )
      }
    />
  );
}