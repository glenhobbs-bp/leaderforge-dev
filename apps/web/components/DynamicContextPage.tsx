// File: apps/web/components/DynamicContextPage.tsx
"use client";

import { useState } from "react";
import ThreePanelLayout from "./ui/ThreePanelLayout";
import NavPanel, { sampleNavSchema } from "./ui/NavPanel";
// import { ContentSchema } from "../../packages/agent-core/types/contentSchema";
// Temporary fallback type if needed
// type ContentSchema = any;
import { ComponentSchemaRenderer } from "./ai/ComponentSchemaRenderer";
// Try to import ContentSchema from agent-core/types/contentSchema
// If this fails, fallback to any and add a TODO
// @ts-ignore
import type { ContentSchema as ComponentSchema } from 'agent-core/types/contentSchema';
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
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const handleNavSelect = async (navOptionId: string) => {
    setSchemaError(null);
    setSchema(null);
    try {
      // Get userId and contextKey
      const userId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || 'test-user';
      const contextKey = contextId;
      const intent = undefined; // or { type: 'viewLibrary' } if you want to be explicit
      const payload = { userId, contextKey, intent, navOptionId };
      console.log('[handleNavSelect] Sending payload:', payload);
    const res = await fetch("/api/agent/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
      console.log('[handleNavSelect] Response status:', res.status);
      if (!res.ok) {
        setSchemaError("Server error. Please try again later.");
        return;
      }
      let data;
      try {
        data = await res.json();
        console.log('[handleNavSelect] Response JSON:', data);
      } catch (err) {
        setSchemaError("Unexpected server response. Please try again later.");
        console.error('[handleNavSelect] JSON parse error:', err);
        return;
      }
    setSchema(data);
      console.log('[handleNavSelect] Set schema:', data);
    } catch (e: any) {
      setSchemaError(e.message || "Unknown error");
      console.error('[handleNavSelect] Error:', e);
    }
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
          navSchema={sampleNavSchema}
          contextOptions={CONTEXTS}
          contextValue={contextId}
          onContextChange={setContextId}
          onNavSelect={handleNavSelect}
        />
      }
      content={
        schemaError ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6">
            <svg className="w-10 h-10 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
            <div className="text-lg font-semibold text-red-600 mb-1">Something went wrong</div>
            <div className="text-gray-700 mb-3">{schemaError}</div>
            <button
              className="px-4 py-2 rounded bg-[var(--primary)] text-white text-sm hover:bg-[var(--accent)] transition font-normal"
              onClick={() => handleNavSelect(sampleNavSchema.props.sections[0]?.items[0]?.id)}
            >
              Retry
            </button>
          </div>
        ) : schema ? <ComponentSchemaRenderer schema={schema} /> : null
      }
      contextConfig={config}
    />
  );
}
