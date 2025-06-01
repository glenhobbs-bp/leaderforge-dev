// File: apps/web/components/DynamicContextPage.tsx
"use client";

import { useState } from "react";
import ThreePanelLayout from "./ui/ThreePanelLayout";
import NavPanel from "./ui/NavPanel";
import { ContentSchema } from "../../packages/agent-core/types/contentSchema";
import { ContentSchemaRenderer } from "./ai/ContentSchemaRenderer";
import contextConfigBrilliant from "../config/contextConfig.json";
import contextConfigLeaderforge from "../config/contextConfig-leaderforge.json";

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

const CONTEXTS = [
  {
    id: contextConfigBrilliant.context_id,
    title: contextConfigBrilliant.context_title,
    subtitle: contextConfigBrilliant.context_subtitle,
    icon: "🌟",
  },
  {
    id: contextConfigLeaderforge.context_id,
    title: contextConfigLeaderforge.context_title,
    subtitle: contextConfigLeaderforge.context_subtitle,
    icon: "🏢",
  },
];
const CONTEXT_MAP = {
  [contextConfigBrilliant.context_id]: contextConfigBrilliant,
  [contextConfigLeaderforge.context_id]: contextConfigLeaderforge,
};

export default function DynamicContextPage() {
  const [contextId, setContextId] = useState(CONTEXTS[0].id);
  const config = CONTEXT_MAP[contextId];
  const [schema, setSchema] = useState<ContentSchema | null>(null);

  const handleNavSelect = async (navOptionId: string) => {
    const res = await fetch("/api/agent/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ navOptionId }),
    });
    const data = await res.json();
    setSchema(data);
  };

  return (
    <ThreePanelLayout
      nav={
        <NavPanel
          navOptions={config.nav}
          contextOptions={CONTEXTS}
          contextValue={contextId}
          onContextChange={setContextId}
          onNavSelect={handleNavSelect}
        />
      }
      content={schema ? <ContentSchemaRenderer schema={schema} /> : null}
      contextConfig={config}
    />
  );
}
