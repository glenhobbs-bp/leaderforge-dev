/**
 * File: apps/web/components/ui/EditContextModal.tsx
 * Purpose: Modal for editing prompt context details with form validation
 * Owner: Engineering Team
 * Tags: #modal #context #forms #phase1 #adr-0026
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import {
  parseTemplateVariables,
  templateVariablesToText,
  type PromptContext
} from '../../lib/validation/contextSchemas';

interface EditContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: PromptContext | null;
  onSave?: (updatedContext: PromptContext) => void;
}

interface FormErrors {
  name?: string;
  description?: string;
  content?: string;
  scope?: string;
  priority?: string;
  template_variables?: string;
}

export function EditContextModal({ isOpen, onClose, context, onSave }: EditContextModalProps) {
  const [formData, setFormData] = useState<Partial<PromptContext>>({
    name: '',
    description: '',
    content: '',
    scope: 'Personal',
    priority: 1,
    template_variables: {}
  });
  const [templateVariablesText, setTemplateVariablesText] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ message: string; type: 'success' | 'error'; visible: boolean } | null>(null);

  // Initialize form data when context changes
  useEffect(() => {
    if (context) {
      setFormData({
        name: context.name || '',
        description: context.description || '',
        content: context.content || '',
        scope: context.scope || 'Personal',
        priority: context.priority || 1,
        template_variables: context.template_variables || {}
      });

      // Convert template variables to text format for editing
      const templateText = templateVariablesToText(context.template_variables);
      setTemplateVariablesText(templateText);
    } else {
      // Reset form for new context
      setFormData({
        name: '',
        description: '',
        content: '',
        scope: 'Personal',
        priority: 1,
        template_variables: {}
      });
      setTemplateVariablesText('');
    }
    setErrors({});
    setBanner(null);
  }, [context]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    // Description validation
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Content validation
    if (!formData.content?.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.trim().length < 20) {
      newErrors.content = 'Content must be at least 20 characters';
    } else if (formData.content.trim().length > 10000) {
      newErrors.content = 'Content must be less than 10,000 characters';
    }

    // Priority validation
    if (typeof formData.priority !== 'number' || formData.priority < 1 || formData.priority > 100) {
      newErrors.priority = 'Priority must be between 1 and 100';
    }

         // Template variables validation
     if (templateVariablesText.trim()) {
       try {
         parseTemplateVariables(templateVariablesText);
       } catch {
         newErrors.template_variables = 'Invalid template variables format. Use key=value pairs, one per line.';
       }
     }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

    // Remove custom parseTemplateVariables function since we're using the imported one

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const templateVariables = parseTemplateVariables(templateVariablesText);

      const url = context?.id ? `/api/context/${context.id}` : '/api/context';
      const method = context?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          content: formData.content,
          scope: formData.scope,
          priority: formData.priority,
          template_variables: templateVariables
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save context');
      }

      const result = await response.json();
      console.log('Context saved successfully:', result);

      showBanner('Context saved successfully!', 'success');

      // Call onSave callback with the saved context
      if (onSave) {
        onSave(result.context);
      }

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('[EditContextModal] Save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save context. Please try again.';
      showBanner(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showBanner = (message: string, type: 'success' | 'error') => {
    setBanner({ message, type, visible: true });
    setTimeout(() => {
      setBanner(prev => prev ? { ...prev, visible: false } : null);
      setTimeout(() => setBanner(null), 400);
    }, 3000);
  };

  const handleInputChange = (field: keyof PromptContext, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  if (!isOpen) return null;

  const isEditMode = !!context;
  const canEdit = !context || context.is_editable !== false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
              <DialogContent className="sm:max-w-2xl w-full mx-4 p-0 overflow-hidden border-0 bg-transparent shadow-lg max-h-[95vh]">
        <div
          className="relative rounded-lg p-4 border border-white/20 h-full overflow-y-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 50%, rgba(241,245,249,0.95) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          {/* Header */}
          <DialogHeader className="mb-4">
            <DialogTitle className="text-base font-semibold text-slate-800 tracking-tight">
              {isEditMode ? 'Edit Context' : 'Create New Context'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              {isEditMode ? 'Edit existing prompt context' : 'Create new prompt context'}
            </DialogDescription>
          </DialogHeader>

          {/* Banner Notification */}
          {banner && (
            <div
              className={`mb-3 p-2 rounded-md text-xs font-medium transition-all duration-400 ease-in-out ${
                banner.visible
                  ? 'opacity-100 transform translate-y-0'
                  : 'opacity-0 transform -translate-y-2'
              } ${
                banner.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{banner.message}</span>
              </div>
            </div>
          )}

          {/* Permission Check */}
          {!canEdit && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3 h-3 text-yellow-600" />
                                 <span className="text-xs text-yellow-700">
                   You don&apos;t have permission to edit this context.
                 </span>
              </div>
            </div>
          )}

          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {/* Name Field */}
            <div>
              <label
                htmlFor="context-name"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Name <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                id="context-name"
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter context name"
                disabled={!canEdit}
                aria-describedby={errors.name ? 'name-error' : undefined}
                aria-invalid={!!errors.name}
                aria-required="true"
                className={`w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 transition-all duration-200 ${
                  errors.name
                    ? 'border-red-300 focus:ring-red-500/30 focus:border-red-400'
                    : 'border-slate-200/80 focus:ring-slate-400/30 focus:border-slate-300'
                } bg-white/70 backdrop-blur-sm ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.name && (
                <p id="name-error" className="mt-0.5 text-xs text-red-600" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of this context"
                rows={2}
                disabled={!canEdit}
                className={`w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 transition-all duration-200 resize-none ${
                  errors.description
                    ? 'border-red-300 focus:ring-red-500/30 focus:border-red-400'
                    : 'border-slate-200/80 focus:ring-slate-400/30 focus:border-slate-300'
                } bg-white/70 backdrop-blur-sm ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.description && (
                <p className="mt-0.5 text-xs text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Content Field */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content || ''}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Enter the context content that will be provided to AI"
                rows={15}
                disabled={!canEdit}
                className={`w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 transition-all duration-200 resize-vertical ${
                  errors.content
                    ? 'border-red-300 focus:ring-red-500/30 focus:border-red-400'
                    : 'border-slate-200/80 focus:ring-slate-400/30 focus:border-slate-300'
                } bg-white/70 backdrop-blur-sm ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.content && (
                <p className="mt-0.5 text-xs text-red-600">{errors.content}</p>
              )}
            </div>

            {/* Scope and Priority Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Scope Field */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Scope <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.scope || 'Personal'}
                  onChange={(e) => handleInputChange('scope', e.target.value)}
                  disabled={!canEdit}
                  className={`w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 transition-all duration-200 ${
                    errors.scope
                      ? 'border-red-300 focus:ring-red-500/30 focus:border-red-400'
                      : 'border-slate-200/80 focus:ring-slate-400/30 focus:border-slate-300'
                  } bg-white/70 backdrop-blur-sm ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="Personal">Personal</option>
                  <option value="Team">Team</option>
                  <option value="Organizational">Organizational</option>
                  <option value="Global">Global</option>
                </select>
                {errors.scope && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.scope}</p>
                )}
              </div>

              {/* Priority Field */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Priority <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.priority || 1}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                  disabled={!canEdit}
                  className={`w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 transition-all duration-200 ${
                    errors.priority
                      ? 'border-red-300 focus:ring-red-500/30 focus:border-red-400'
                      : 'border-slate-200/80 focus:ring-slate-400/30 focus:border-slate-300'
                  } bg-white/70 backdrop-blur-sm ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.priority && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.priority}</p>
                )}
              </div>
            </div>

            {/* Template Variables Field */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Template Variables
              </label>
              <textarea
                value={templateVariablesText}
                onChange={(e) => {
                  setTemplateVariablesText(e.target.value);
                  if (errors.template_variables) {
                    setErrors(prev => ({ ...prev, template_variables: undefined }));
                  }
                }}
                placeholder="key1=value1&#10;key2=value2&#10;key3=value3"
                rows={3}
                disabled={!canEdit}
                className={`w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 transition-all duration-200 resize-none ${
                  errors.template_variables
                    ? 'border-red-300 focus:ring-red-500/30 focus:border-red-400'
                    : 'border-slate-200/80 focus:ring-slate-400/30 focus:border-slate-300'
                } bg-white/70 backdrop-blur-sm ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <p className="mt-0.5 text-xs text-slate-500">
                Enter template variables in key=value format, one per line
              </p>
              {errors.template_variables && (
                <p className="mt-0.5 text-xs text-red-600">{errors.template_variables}</p>
              )}
            </div>

            {/* Action Buttons */}
            {canEdit && (
              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-describedby={isSubmitting ? 'saving-status' : undefined}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded transition-all duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                      <span id="saving-status">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3" aria-hidden="true" />
                      {isEditMode ? 'Update Context' : 'Create Context'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  aria-label="Cancel editing and close modal"
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 text-slate-700 text-xs font-medium rounded transition-all duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}