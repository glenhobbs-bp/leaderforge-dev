"use client";
// File: apps/web/components/DynamicContextPage.tsx
// Purpose: Main 3-panel layout for schema-driven app. Fetches context config and entitlement-filtered nav options, builds dynamic NavPanel, and renders content panel based on agent/entitlement.
import { useState, useEffect, useMemo } from "react";
import ThreePanelLayout from "./ui/ThreePanelLayout";
import NavPanel from "./ui/NavPanel";
import { ComponentSchemaRenderer } from "./ai/ComponentSchemaRenderer";
// @ts-ignore
import type { ContentSchema as ComponentSchema } from 'agent-core/types/contentSchema';
import { useContextConfig } from "../hooks/useContextConfig";
import { useNavOptions } from "../hooks/useNavOptions";
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Loader2 } from 'lucide-react';
import { groupBy, sortBy } from "lodash";
import React from "react";

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

// --- New: useContextList hook ---
function useContextList() {
  const [contexts, setContexts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setLoading(true);
    fetch('/api/context/list', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setContexts(Array.isArray(data) ? data : []);
        setLoading(false);
        setError(null);
        console.log('[useContextList] Loaded contexts:', data);
      })
      .catch(e => {
        setError(e.message || 'Failed to load contexts');
        setLoading(false);
        setContexts([]);
        console.error('[useContextList] Error:', e);
      });
  }, []);
  return { contexts, loading, error };
}

export default function DynamicContextPage() {
  // All hooks at the top!
  const { contexts, loading: contextsLoading, error: contextsError } = useContextList();
  const { session } = useSessionContext();
  const userId = session?.user?.id || null;

  // --- Load available contexts dynamically ---
  const [contextId, setContextId] = useState<string | null>(null);

  // Set default contextId to first available context
  useEffect(() => {
    if (!contextId && contexts.length > 0) {
      setContextId(contexts[0].context_key);
      console.log('[DynamicContextPage] Defaulting contextId to:', contexts[0].context_key);
    }
  }, [contexts, contextId]);

  useEffect(() => {
    console.log('[DynamicContextPage] contextId:', contextId);
  }, [contextId]);

  const { config, loading, error } = useContextConfig(contextId || '');
  const { navOptions, loading: navLoading, error: navError } = useNavOptions(contextId || '');

  useEffect(() => {
    console.log('[DynamicContextPage] navOptions:', navOptions);
  }, [navOptions]);

  // Build NavPanel schema dynamically from navOptions
  const navSections = useMemo(() => {
    if (!navOptions || !Array.isArray(navOptions)) return [];
    const grouped = groupBy(navOptions, item => (item.section?.trim() || ''));
    const allSectionsEmpty = Object.keys(grouped).length === 1 && Object.keys(grouped)[0] === '';
    if (allSectionsEmpty) {
      return [{ title: null, items: sortBy(navOptions, 'order') }];
    }
    return Object.entries(grouped)
      .map(([section, items]) => ({
        title: section || null,
        sectionOrder: Math.min(...items.map(i => i.section_order ?? 0)),
        items: sortBy(items, 'order'),
      }))
      .sort((a, b) => a.sectionOrder - b.sectionOrder);
  }, [navOptions]);

  const [schema, setSchema] = useState<ComponentSchema | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  const handleNavSelect = async (navOptionId: string) => {
    setSchemaError(null);
    setSchema(null);
    setSchemaLoading(true);
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
        setSchemaLoading(false);
        return;
      }
      const data = await res.json();
      console.log('[handleNavSelect] Response JSON:', data);
      setSchema(data);
    } catch (e: any) {
      setSchemaError(e.message || "Unknown error");
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleContentSchemaUpdate = (newSchema: ComponentSchema) => {
    setSchema(newSchema);
  };

  // Debug logging for hydration issues
  useEffect(() => {
    console.log({ contexts, contextId, session, userId });
  }, [contexts, contextId, session, userId]);

  // Debug logging for nav options
  useEffect(() => {
    console.log({ navOptions, navOptionsLoading: navLoading, navOptionsError: navError });
  }, [navOptions, navLoading, navError]);

  // Debug loading guard
  console.log("Loading guard check", {
    contextsLoading,
    contextsLength: contexts.length,
    contextId,
    session,
    userId,
  });

  console.log('DynamicContextPage mounted');

  // Now do your loading guard
  if (contextsLoading || !contexts.length || !session || !userId) {
    return (
      <div style={{ background: '#f3f4f6', minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', color: '#222b45', fontSize: 14, padding: 8 }}>
        Loading...
      </div>
    );
  }

  if (contextsError || !contexts.length) return (
    <div style={{ background: '#fee', color: '#900', padding: 16 }}>Error loading contexts</div>
  );
  if (loading) return (
    <div style={{ background: '#f3f4f6', minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', color: '#222b45', fontSize: 14, padding: 8 }}>
      Loading context config...
    </div>
  );
  if (error || !config || !config.theme) return (
    <div style={{ background: '#f3f4f6', minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', color: '#d32f2f', fontSize: 15, fontWeight: 500, padding: 12, letterSpacing: 0.1 }}>
      Error loading context config
    </div>
  );
  if (navLoading) return <div>Loading navigation...</div>;
  if (navError || !navOptions) return <div style={{ background: '#fee', color: '#900', padding: 16 }}>Error loading navigation</div>;

  return (
    <ThreePanelLayout
      nav={
        <NavPanel
          navSchema={{
            type: "NavPanel",
            props: {
              header: { greeting: "Welcome back, Glen!" },
              sections: navSections,
              footer: {
                profile: {
                  name: session?.user?.user_metadata?.full_name || session?.user?.email || "User",
                  avatarUrl: session?.user?.user_metadata?.avatar_url || null,
                },
                actions: [
                  { label: "Sign Out", action: "signOut", icon: "logout" }
                ]
              }
            }
          }}
          contextOptions={contexts.map(ctx => ({
            id: ctx.context_key,
            title: ctx.display_name,
            subtitle: ctx.subtitle || ctx.i18n?.subtitle || "",
            icon: ctx.logo_url,
          }))}
          contextValue={contextId || ''}
          onContextChange={setContextId}
          onNavSelect={handleNavSelect}
          userId={userId}
        />
      }
      content={
        schemaLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Loader2 className="animate-spin w-8 h-8 mb-4" />
            <span>Loading...</span>
          </div>
        ) : schemaError ? (
          <div className="flex flex-col items-center justify-center h-full text-red-500">
            <span>{schemaError}</span>
          </div>
        ) : schema ? (
          schema.type === 'AccessDenied' ? (
            <div className="flex flex-col items-center justify-center h-full text-yellow-600">
              <span>Access Denied: You do not have permission to view this section.</span>
            </div>
          ) : (
            <ComponentSchemaRenderer schema={schema} />
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span>No content available for this section.</span>
          </div>
        )
      }
      contextConfig={config}
    />
  );
}
