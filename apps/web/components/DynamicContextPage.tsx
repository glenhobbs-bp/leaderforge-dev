// File: apps/web/components/DynamicContextPage.tsx
"use client";

import { useState } from "react";
import ThreePanelLayout from "./ui/ThreePanelLayout";
import NavPanel, { sampleNavSchema } from "./ui/NavPanel";
import { ComponentSchemaRenderer } from "./ai/ComponentSchemaRenderer";
// @ts-ignore
import type { ContentSchema as ComponentSchema } from 'agent-core/types/contentSchema';
import { useContextConfig } from "../hooks/useContextConfig";
import { useNavOptions } from "../hooks/useNavOptions";
import { useSessionContext } from '@supabase/auth-helpers-react';

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
  const { session } = useSessionContext();
  const userId = session?.user?.id || null;
  const [contextId, setContextId] = useState(CONTEXTS[0].id);

  const { config, loading, error } = useContextConfig(contextId);
  const { navOptions, loading: navLoading, error: navError } = useNavOptions(contextId, userId);

  const [schema, setSchema] = useState<ComponentSchema | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const handleNavSelect = async (navOptionId: string) => {
    setSchemaError(null);
    setSchema(null);
    try {
      const contextKey = contextId;
      const intent = undefined;
      const payload = { userId, contextKey, intent, navOptionId };
      console.log('[handleNavSelect] Sending payload:', payload);
      const res = await fetch("/api/agent/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      console.log('[handleNavSelect] Response status:', res.status);
      if (!res.ok) {
        setSchemaError("Server error. Please try again later.");
        return;
      }
      const data = await res.json();
      console.log('[handleNavSelect] Response JSON:', data);
      setSchema(data);
    } catch (e: any) {
      setSchemaError(e.message || "Unknown error");
      console.error('[handleNavSelect] Error:', e);
    }
  };

  const handleContentSchemaUpdate = (newSchema: ComponentSchema) => {
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
          navSchema={sampleNavSchema}
          contextOptions={CONTEXTS}
          contextValue={contextId}
          onContextChange={setContextId}
          onNavSelect={handleNavSelect}
          userId={userId}
        />
      }
      content={
        schema ? (
          <ComponentSchemaRenderer schema={schema} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span>Select a navigation option to get started.</span>
          </div>
        )
      }
      contextConfig={config}
    />
  );
}
