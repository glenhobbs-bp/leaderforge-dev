// File: apps/web/components/DynamicContextPage.tsx
"use client";

import { useState } from "react";
import ThreePanelLayout from "./ui/ThreePanelLayout";
import NavPanel from "./ui/NavPanel";
// import { ContentSchema } from "../../packages/agent-core/types/contentSchema";
// Temporary fallback type if needed
// type ContentSchema = any;
import { ComponentSchemaRenderer } from "./ai/ComponentSchemaRenderer";
import type { ComponentSchema } from "../../packages/agent-core/types/ComponentSchema";
import { useContextConfig } from "../hooks/useContextConfig";
import { useNavOptions } from "../hooks/useNavOptions";

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
    id: "brilliant",
    title: "Brilliant Movement",
    subtitle: "Kingdom Activation",
    icon: "🌟",
  },
  {
    id: "leaderforge",
    title: "LeaderForge",
    subtitle: "Turning Potential into Performance",
    icon: "🏢",
  },
];

export default function DynamicContextPage() {
  const [contextId, setContextId] = useState(CONTEXTS[0].id);
  const { config, loading, error } = useContextConfig(contextId);
  const { navOptions, loading: navLoading, error: navError } = useNavOptions(contextId);
  const [schema, setSchema] = useState<ComponentSchema | null>(null);

  const handleNavSelect = async (navOptionId: string) => {
    const res = await fetch("/api/agent/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ navOptionId }),
    });
    const data = await res.json();
    setSchema(data);
  };

  const handleContentSchemaUpdate = (newSchema: any) => {
    setSchema(newSchema);
  };

  if (loading) return <div>Loading context config...</div>;
  if (error || !config || !config.theme) return <div style={{ background: '#fee', color: '#900', padding: 16 }}>Error loading context config</div>;
  if (navLoading) return <div>Loading navigation...</div>;
  if (navError || !navOptions) return <div style={{ background: '#fee', color: '#900', padding: 16 }}>Error loading navigation</div>;

  return (
    <ThreePanelLayout
      nav={
        <NavPanel
          navOptions={navOptions}
          contextOptions={CONTEXTS}
          contextValue={contextId}
          onContextChange={setContextId}
          onNavSelect={handleNavSelect}
        />
      }
      content={schema ? <ComponentSchemaRenderer schema={schema} /> : null}
      contextConfig={config}
    />
  );
}
