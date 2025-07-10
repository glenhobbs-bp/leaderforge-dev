/**
 * File: apps/web/components/ui/ViewContextModal.tsx
 * Purpose: Modal for viewing prompt context details in read-only mode
 * Owner: Engineering Team
 * Tags: #modal #context #view #readonly #phase1
 */

"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Edit, X, Calendar, User, Hash, Tag, Settings, AlertCircle } from 'lucide-react';
import { type PromptContext } from '../../lib/validation/contextSchemas';

interface ViewContextModalProps {
  context: PromptContext | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (context: PromptContext) => void;
  showEditButton?: boolean;
}

interface BannerState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

export function ViewContextModal({
  context,
  isOpen,
  onClose,
  onEdit,
  showEditButton = true
}: ViewContextModalProps) {
  const [banner, setBanner] = useState<BannerState>({
    message: '',
    type: 'info',
    visible: false
  });

  const showBanner = (message: string, type: 'success' | 'error' | 'info') => {
    setBanner({ message, type, visible: true });
    setTimeout(() => {
      setBanner(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleEdit = () => {
    if (context && onEdit) {
      if (!context.is_editable) {
        showBanner('You don\'t have permission to edit this context.', 'error');
        return;
      }
      onEdit(context);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'Personal': return 'bg-blue-100 text-blue-800';
      case 'Team': return 'bg-green-100 text-green-800';
      case 'Organizational': return 'bg-purple-100 text-purple-800';
      case 'Global': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 10) return 'bg-red-100 text-red-800';
    if (priority <= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const formatTemplateVariables = (variables: Record<string, string> | undefined) => {
    if (!variables || Object.keys(variables).length === 0) {
      return 'None';
    }

    return Object.entries(variables)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
  };

  if (!context) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" aria-describedby="view-context-description">
        <DialogHeader>
          <DialogTitle
            id="view-context-title"
            className="flex items-center justify-between text-base"
          >
            <span className="truncate">{context.name}</span>
            <div className="flex items-center gap-1.5 ml-4">
              {showEditButton && context.is_editable && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1"
                  title="Edit Context"
                  aria-label={`Edit context: ${context.name}`}
                >
                  <Edit size={12} aria-hidden="true" />
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1"
                title="Close"
                aria-label="Close context view modal"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </DialogTitle>
          <DialogDescription id="view-context-description" className="text-xs">
            View context details, metadata, and usage information
          </DialogDescription>
        </DialogHeader>

        {/* Banner */}
        {banner.visible && (
          <div className={`p-2 rounded mb-3 flex items-center gap-2 ${
            banner.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            banner.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <AlertCircle size={14} />
            <span className="text-xs">{banner.message}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Context Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-gray-500" />
                <span className="text-xs font-medium">Scope:</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getScopeColor(context.scope)}`}>
                  {context.scope}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Hash size={14} className="text-gray-500" />
                <span className="text-xs font-medium">Priority:</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(context.priority)}`}>
                  {context.priority}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Settings size={14} className="text-gray-500" />
                <span className="text-xs font-medium">Editable:</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  context.is_editable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {context.is_editable ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-500" />
                <span className="text-xs font-medium">Created:</span>
                <span className="text-xs text-gray-600">{formatDate(context.created_at)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-500" />
                <span className="text-xs font-medium">Updated:</span>
                <span className="text-xs text-gray-600">{formatDate(context.updated_at)}</span>
              </div>

              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-500" />
                <span className="text-xs font-medium">Created by:</span>
                <span className="text-xs text-gray-600">{context.created_by || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold mb-1">Description</h3>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-700 whitespace-pre-wrap">{context.description}</p>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-sm font-semibold mb-1">Content</h3>
            <div className="bg-gray-50 p-2 rounded max-h-64 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                {context.content}
              </pre>
            </div>
          </div>

          {/* Template Variables */}
          <div>
            <h3 className="text-sm font-semibold mb-1">Template Variables</h3>
            <div className="bg-gray-50 p-2 rounded">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                {formatTemplateVariables(context.template_variables)}
              </pre>
            </div>
          </div>

          {/* Usage Statistics (Placeholder for future analytics) */}
          <div>
            <h3 className="text-sm font-semibold mb-1">Usage Statistics</h3>
            <div className="bg-gray-50 p-2 rounded">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-white rounded">
                  <div className="text-lg font-bold text-blue-600">--</div>
                  <div className="text-xs text-gray-600">Times Used</div>
                </div>
                <div className="p-2 bg-white rounded">
                  <div className="text-lg font-bold text-green-600">--</div>
                  <div className="text-xs text-gray-600">Sessions</div>
                </div>
                <div className="p-2 bg-white rounded">
                  <div className="text-lg font-bold text-purple-600">--</div>
                  <div className="text-xs text-gray-600">Last Used</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Usage analytics will be available in Phase 2 of the implementation.
              </p>
            </div>
          </div>

          {/* Technical Details */}
          <div>
            <h3 className="text-sm font-semibold mb-1">Technical Details</h3>
            <div className="bg-gray-50 p-2 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium">Context ID:</span>
                  <span className="ml-2 text-gray-600 font-mono">{context.id}</span>
                </div>
                <div>
                  <span className="font-medium">Content Length:</span>
                  <span className="ml-2 text-gray-600">{context.content.length} characters</span>
                </div>
                <div>
                  <span className="font-medium">Template Variables:</span>
                  <span className="ml-2 text-gray-600">
                    {context.template_variables ? Object.keys(context.template_variables).length : 0} variables
                  </span>
                </div>
                <div>
                  <span className="font-medium">Description Length:</span>
                  <span className="ml-2 text-gray-600">{context.description.length} characters</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}