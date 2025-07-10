/**
 * File: apps/web/components/widgets/PromptContextWidget.tsx
 * Purpose: Prompt Context Management Widget - Controls user AI interaction contexts
 * Owner: Widget Team
 * Tags: #widgets #prompt-contexts #ai-configuration
 */

"use client";

import React, { useState } from 'react';
import { Plus, Settings, Eye, Edit2, Users, Building2, Globe } from 'lucide-react';
import { EditContextModal } from '../ui/EditContextModal';
import { ViewContextModal } from '../ui/ViewContextModal';
import { type PromptContext as ModalPromptContext } from '../../lib/validation/contextSchemas';

interface PromptContext {
  id: string;
  name: string;
  description: string;
  type: 'personal' | 'team' | 'organization' | 'external';
  isActive: boolean;
  canEdit: boolean;
  icon: string;
  priority: number;
  lastUpdated: string;
  usage: number;
}

interface PromptContextWidgetProps {
  data: {
    contexts?: PromptContext[];
    groupByScope?: boolean;
    showScopeIcons?: boolean;
    enableRealTimeToggle?: boolean;
    apiEndpoint?: string;
  };
}

// Agent data structure (what the agent returns)
interface AgentContextData {
  id: string;
  name: string;
  description: string;
  scope: string;
  isEnabled: boolean;
  canEdit: boolean;
  requiresLicense: boolean;
  priority: number;
}

export function PromptContextWidget({ data }: PromptContextWidgetProps) {
  const [contexts, setContexts] = useState<PromptContext[]>(data?.contexts || []);

  // Modal state management
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedContext, setSelectedContext] = useState<PromptContext | null>(null);

  const handleToggleContext = (contextId: string) => {
    setContexts(contexts.map(ctx =>
      ctx.id === contextId ? { ...ctx, isActive: !ctx.isActive } : ctx
    ));
  };

  // Transform widget context to modal context format
  const transformToModalContext = (context: PromptContext): ModalPromptContext => {
    return {
      id: context.id,
      name: context.name,
      description: context.description,
      content: '', // We don't have content in the widget context
      scope: context.type === 'personal' ? 'Personal' :
             context.type === 'team' ? 'Team' :
             context.type === 'organization' ? 'Organizational' : 'Global',
      priority: context.priority,
      template_variables: {},
      is_editable: context.canEdit,
      created_at: undefined,
      updated_at: undefined,
      created_by: undefined
    };
  };

  const handleViewContext = (context: PromptContext) => {
    setSelectedContext(context);
    setShowViewModal(true);
  };

  const handleEditContext = (context: PromptContext) => {
    setSelectedContext(context);
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedContext(null);
  };

  const handleNewContext = () => {
    setSelectedContext(null); // null context means create mode
    setShowEditModal(true);
  };

  const getContextIcon = (type: string) => {
    switch (type) {
      case 'personal': return <Settings className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
      case 'organization': return <Building2 className="w-4 h-4" />;
      case 'external': return <Globe className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getContextTypeColor = (type: string) => {
    switch (type) {
      case 'personal': return 'text-blue-600';
      case 'team': return 'text-green-600';
      case 'organization': return 'text-purple-600';
      case 'external': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header Section - Match Prompt Library pattern */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Prompt Context Management
          </h1>
          <p className="text-sm text-gray-600">
            Configure how AI understands and responds to you across all LeaderForge interactions
          </p>
        </div>
        <button
          onClick={handleNewContext}
          className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
          title="Create new context"
        >
          <Plus className="w-4 h-4" />
          New Context
        </button>
      </div>



      {/* Context Cards Grid - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {contexts.map((context) => (
          <div key={context.id} className="card-glass-subtle p-4 hover:card-glass-interactive">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {/* Context Icon & Toggle */}
                <div className="flex items-center gap-2">
                  <div className={`${getContextTypeColor(context.type)}`}>
                    {getContextIcon(context.type)}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={context.isActive}
                      onChange={() => handleToggleContext(context.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* Context Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-medium text-glass-primary">{context.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      context.type === 'personal' ? 'bg-blue-100 text-blue-700' :
                      context.type === 'team' ? 'bg-green-100 text-green-700' :
                      context.type === 'organization' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {context.type}
                    </span>
                  </div>

                  <p className="text-xs text-glass-muted mb-2 leading-relaxed line-clamp-2">
                    {context.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-glass-muted">
                    <span>Updated {context.lastUpdated}</span>
                    <span>•</span>
                    <span>Used {context.usage} times</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Smaller */}
              <div className="flex items-center gap-1 ml-2">
                {context.canEdit && (
                  <button
                    onClick={() => handleEditContext(context)}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit context"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={() => handleViewContext(context)}
                  className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                  title="View context details"
                >
                  <Eye className="w-3 h-3" />
                </button>

                {context.lastUpdated === 'Licensed' && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    Licensed
                  </span>
                )}

                {!context.canEdit && context.lastUpdated !== 'Licensed' && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    View Only
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Context Hierarchy Info - Smaller and more compact */}
      <div className="mt-6 card-glass-subtle p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-xs font-medium text-glass-primary">Context Inheritance</span>
        </div>
        <p className="text-xs text-glass-muted leading-relaxed">
          Contexts are applied hierarchically: Personal → Team → Organization → External.
          Lower-level contexts override higher-level ones for conflicting directives while additively merging complementary information.
        </p>
      </div>

            {/* Modals */}
      <ViewContextModal
        context={selectedContext ? transformToModalContext(selectedContext) : null}
        isOpen={showViewModal}
        onClose={handleCloseModals}
        onEdit={() => {
          setShowViewModal(false);
          setShowEditModal(true);
        }}
      />

            <EditContextModal
        context={selectedContext ? transformToModalContext(selectedContext) : null}
        isOpen={showEditModal}
        onClose={handleCloseModals}
        onSave={(updatedContext) => {
          // Transform the context data for the widget
          const transformedContext: PromptContext = {
            id: updatedContext.id || selectedContext?.id || '',
            name: updatedContext.name || '',
            description: updatedContext.description || '',
            type: (updatedContext.scope?.toLowerCase() || 'personal') as 'personal' | 'team' | 'organization' | 'external',
            isActive: selectedContext?.isActive || true,
            canEdit: updatedContext.is_editable || true,
            icon: updatedContext.scope?.toLowerCase() || 'personal',
            priority: updatedContext.priority || 1,
            lastUpdated: 'Just now',
            usage: selectedContext?.usage || 0
          };

          if (selectedContext) {
            // Update existing context
            setContexts(contexts.map(ctx =>
              ctx.id === transformedContext.id ? transformedContext : ctx
            ));
          } else {
            // Add new context
            setContexts([...contexts, transformedContext]);
          }

          handleCloseModals();
        }}
      />
    </div>
  );
}

// Schema to props mapper function for widget registry
export function promptContextSchemaToProps(schema: {
  data?: {
    contextData?: {
      contexts?: AgentContextData[];
      groupByScope?: boolean;
      showScopeIcons?: boolean;
      enableRealTimeToggle?: boolean;
      apiEndpoint?: string;
    }
  }
}): PromptContextWidgetProps {
  console.log('promptContextSchemaToProps received schema:', schema);

  // Handle case where schema might be undefined or malformed
  const schemaData = schema?.data || {};
  const contextDataWrapper = schemaData.contextData || {};

  // The agent returns: data.contextData.contexts (nested structure)
  const contexts = contextDataWrapper.contexts || [];

  console.log('Raw contexts from agent:', contexts);

  // Transform agent data to match mockup format
  const transformedContexts = contexts.map((ctx: AgentContextData) => ({
    id: ctx.id || '',
    name: ctx.name || 'Unknown Context',
    description: ctx.description || '',
    type: (ctx.scope || 'personal') as 'personal' | 'team' | 'organization' | 'external',
    isActive: ctx.isEnabled ?? true,
    canEdit: ctx.canEdit ?? true,
    icon: ctx.scope || 'personal',
    priority: ctx.priority || 1,
    lastUpdated: 'Recently', // Agent doesn't provide this yet
    usage: Math.floor(Math.random() * 100) // Mock usage data
  }));

  console.log('Transformed contexts for widget:', transformedContexts);

  return {
    data: {
      contexts: transformedContexts,
      groupByScope: contextDataWrapper.groupByScope ?? true,
      showScopeIcons: contextDataWrapper.showScopeIcons ?? true,
      enableRealTimeToggle: contextDataWrapper.enableRealTimeToggle ?? true,
      apiEndpoint: contextDataWrapper.apiEndpoint || '/api/context/preferences'
    },
  };
}