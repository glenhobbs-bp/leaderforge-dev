"use client";

/**
 * Purpose: Schema-driven form widget using React JSON Schema Form with custom LeaderForge design system styling
 * Owner: Universal Input System
 * Tags: [form, widget, rjsf, schema-driven, universal-input, design-system]
 */

import React, { useState, useEffect } from 'react';
import Form, { IChangeEvent } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema, UiSchema, WidgetProps, FieldTemplateProps, ArrayFieldTemplateProps, RJSFValidationError } from '@rjsf/utils';

interface FormWidgetProps {
  templateId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (result: UniversalInputResponse) => void;
  videoContext?: {
    id: string;
    title: string;
  };
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  schema: RJSFSchema;
  ui_schema: UiSchema;
  agent_config: Record<string, unknown>;
  scoring_schema: Record<string, unknown>;
}

interface UniversalInputResponse {
  success: boolean;
  input_id?: string;
  processing_status: 'immediate' | 'queued' | 'error';
  derivations_triggered: string[];
  calculated_score?: number;
  error?: string;
}

// Custom Text Input Widget - uses tenant theme colors
const CustomTextWidget = (props: WidgetProps) => {
  const { id, value, onChange, placeholder, required } = props;

  return (
    <input
      id={id}
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
      style={{
        border: '1px solid var(--border, #e2e8f0)',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(2px)',
        color: 'var(--text-primary, #1e293b)',
        '--tw-ring-color': 'var(--primary, #3b82f6)',
        '--tw-ring-opacity': '0.3'
      } as React.CSSProperties}
      onFocus={(e) => {
        (e.target as HTMLInputElement).style.borderColor = 'var(--primary, #3b82f6)';
      }}
      onBlur={(e) => {
        (e.target as HTMLInputElement).style.borderColor = 'var(--border, #e2e8f0)';
      }}
    />
  );
};

// Custom Textarea Widget - uses tenant theme colors
const CustomTextareaWidget = (props: WidgetProps) => {
  const { id, value, onChange, placeholder, required } = props;

  return (
    <textarea
      id={id}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      rows={4}
      className="w-full px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 resize-none"
      style={{
        border: '1px solid var(--border, #e2e8f0)',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(2px)',
        color: 'var(--text-primary, #1e293b)',
        '--tw-ring-color': 'var(--primary, #3b82f6)',
        '--tw-ring-opacity': '0.3'
      } as React.CSSProperties}
      onFocus={(e) => {
        (e.target as HTMLTextAreaElement).style.borderColor = 'var(--primary, #3b82f6)';
      }}
      onBlur={(e) => {
        (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border, #e2e8f0)';
      }}
    />
  );
};

// Custom Select Widget - uses tenant theme colors
const CustomSelectWidget = (props: WidgetProps) => {
  const { id, value, onChange, options, required } = props;

  return (
    <select
      id={id}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
      style={{
        border: '1px solid var(--border, #e2e8f0)',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(2px)',
        color: 'var(--text-primary, #1e293b)',
        '--tw-ring-color': 'var(--primary, #3b82f6)',
        '--tw-ring-opacity': '0.3'
      } as React.CSSProperties}
      onFocus={(e) => {
        (e.target as HTMLSelectElement).style.borderColor = 'var(--primary, #3b82f6)';
      }}
      onBlur={(e) => {
        (e.target as HTMLSelectElement).style.borderColor = 'var(--border, #e2e8f0)';
      }}
    >
      <option value="">Select an option...</option>
      {options.enumOptions?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

// Custom Field Template - uses tenant theme colors
const CustomFieldTemplate = (props: FieldTemplateProps) => {
  const { id, label, children, errors, description, required } = props;

  return (
    <div className="mb-5">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium mb-2"
          style={{ color: 'var(--text-primary, #1e293b)' }}
        >
          {label}
          {required && <span style={{ color: 'var(--error-500, #ef4444)' }} className="ml-1">*</span>}
        </label>
      )}
      {description && (
        <div
          className="text-xs mb-2"
          style={{ color: 'var(--text-secondary, #64748b)' }}
        >
          {description}
        </div>
      )}
      {children}
      {errors && (
        <div
          className="mt-1 text-xs"
          style={{ color: 'var(--error-500, #ef4444)' }}
        >
          {errors}
        </div>
      )}
    </div>
  );
};

// Custom Array Widget - uses tenant theme colors
const CustomArrayWidget = (props: WidgetProps) => {
  const { value = [], onChange } = props;

  const addItem = () => {
    onChange([...value, '']);
  };

  const removeItem = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const updateItem = (index: number, newValue: string) => {
    const updated = [...value];
    updated[index] = newValue;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {value.map((item: string, index: number) => (
        <div key={index} className="flex gap-2 items-start">
          <div className="flex-1">
            <input
              type="text"
              value={item || ''} // Ensure never undefined
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={`Item ${index + 1}`}
              className="w-full px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
              style={{
                border: '1px solid var(--border, #e2e8f0)',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(2px)',
                color: 'var(--text-primary, #1e293b)',
                '--tw-ring-color': 'var(--primary, #3b82f6)',
                '--tw-ring-opacity': '0.3'
              } as React.CSSProperties}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = 'var(--primary, #3b82f6)';
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = 'var(--border, #e2e8f0)';
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="w-5 h-5 rounded-full text-xs transition-all duration-200 flex items-center justify-center opacity-60 hover:opacity-100"
            style={{
              backgroundColor: 'var(--surface, #f1f5f9)',
              color: 'var(--text-secondary, #64748b)',
              border: '1px solid var(--border, #e2e8f0)'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--error-50, #fef2f2)';
              (e.target as HTMLButtonElement).style.color = 'var(--error-500, #ef4444)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--surface, #f1f5f9)';
              (e.target as HTMLButtonElement).style.color = 'var(--text-secondary, #64748b)';
            }}
          >
            −
          </button>
        </div>
      ))}

      {/* Add Item Button */}
      <button
        type="button"
        onClick={addItem}
        className="w-full px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-200 border border-dashed shadow-sm hover:shadow-md hover:scale-105"
        style={{
          borderColor: 'var(--primary, #3b82f6)',
          color: 'var(--primary, #3b82f6)',
          backgroundColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = 'var(--primary, #3b82f6)';
          (e.target as HTMLButtonElement).style.color = 'white';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
          (e.target as HTMLButtonElement).style.color = 'var(--primary, #3b82f6)';
        }}
      >
        + Add Item
      </button>
    </div>
  );
};

// Custom Array Field Template - uses tenant theme colors
const CustomArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const { items, canAdd, onAddClick, title } = props;

  return (
    <div className="mb-5">
      {title && (
        <h3
          className="text-xs font-medium mb-2"
          style={{ color: 'var(--text-primary, #1e293b)' }}
        >
          {title}
        </h3>
      )}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex gap-2 items-end">
            <div className="flex-1">{item.children}</div>
            {item.hasRemove && (
              <button
                type="button"
                onClick={item.onDropIndexClick(item.index)}
                className="px-2 py-1 text-xs rounded-lg transition-colors"
                style={{
                  color: 'var(--error-500, #ef4444)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'var(--error-50, #fef2f2)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      {canAdd && onAddClick && (
        <button
          type="button"
          onClick={onAddClick}
          className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
          style={{
            color: 'var(--text-secondary, #64748b)',
            backgroundColor: 'var(--surface, #f8fafc)'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'var(--border, #e2e8f0)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'var(--surface, #f8fafc)';
          }}
        >
          Add Item
        </button>
      )}
    </div>
  );
};

// Custom widgets object
const customWidgets = {
  TextWidget: CustomTextWidget,
  TextareaWidget: CustomTextareaWidget,
  SelectWidget: CustomSelectWidget,
  array: CustomArrayWidget,
};

export function FormWidget({ templateId, isOpen, onClose, onSubmit, videoContext }: FormWidgetProps) {
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<RJSFValidationError[]>([]);
  const [existingSubmission, setExistingSubmission] = useState<{id: string, input_data?: any} | null>(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[FormWidget] Fetching template:', templateId);
        const response = await fetch(`/api/form-templates/${templateId}`);
        console.log('[FormWidget] Template response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[FormWidget] Template fetch failed:', response.status, errorText);
          throw new Error(`Failed to fetch template: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[FormWidget] Template data received:', data);

        // ✅ Clean video context metadata from schema before rendering
        const cleanedSchema = { ...data.schema };
        if (cleanedSchema.properties?.video_context) {
          delete cleanedSchema.properties.video_context;
        }
        if (cleanedSchema.properties?.video_id) {
          delete cleanedSchema.properties.video_id;
        }
        if (cleanedSchema.properties?.video_title) {
          delete cleanedSchema.properties.video_title;
        }
        if (cleanedSchema.properties?.video_duration) {
          delete cleanedSchema.properties.video_duration;
        }

        // Set template with cleaned schema
        setTemplate({
          ...data,
          schema: cleanedSchema
        });

        // Check for existing submission if video context is provided
        if (videoContext) {
          await checkExistingSubmission();
        }
      } catch (err) {
        console.error('[FormWidget] Error fetching template:', err);
        setError(err instanceof Error ? err.message : 'Failed to load form template');
      } finally {
        setLoading(false);
      }
    };

    const checkExistingSubmission = async () => {
      if (!videoContext) return;

      try {
        console.log('[FormWidget] Checking for existing submission:', { videoId: videoContext.id, templateId });
        const response = await fetch(`/api/input/universal/check?videoId=${videoContext.id}&templateId=${templateId}`);

        if (response.ok) {
          const existing = await response.json();
          if (existing.found) {
            console.log('[FormWidget] Found existing submission:', existing);
            setExistingSubmission(existing.data);
            setFormData(existing.data.input_data?.responses || {});
            setIsUpdateMode(true);
          }
        }
      } catch (err) {
        console.log('[FormWidget] No existing submission found or error checking:', err);
        // Not a critical error - continue with new submission
      }
    };

    fetchTemplate();
  }, [templateId, isOpen, videoContext]);

  const handleError = (errors: RJSFValidationError[]) => {
    // Handle validation errors gracefully instead of logging to console
    console.log('[FormWidget] Validation errors:', errors);
    setValidationErrors(errors);
    // Clear errors after 5 seconds
    setTimeout(() => setValidationErrors([]), 5000);
  };

  const handleSubmit = async (data: IChangeEvent) => {
    setIsSubmitting(true);
    setValidationErrors([]); // Clear any previous validation errors

    try {
      // Create enhanced input data with video context
      const inputData = {
        template_id: templateId,
        template_name: template?.name,
        responses: data.formData,
        completion_percentage: 100,
        completion_timestamp: new Date().toISOString(),
        ...(videoContext && {
          video_id: videoContext.id,
          video_title: videoContext.title,
          video_context: {
            id: videoContext.id,
            title: videoContext.title
          }
        })
      };

      // Create source context with video information
      const sourceContext = videoContext
        ? `worksheet:video-reflection:${videoContext.id}:${templateId}`
        : `worksheet:video-reflection:${templateId}`;

      // Submit through Universal Input System
      const response = await fetch('/api/input/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_type: 'form',
          input_data: inputData,
          source_context: sourceContext,
          context_type: 'team',
          requires_agent: true,
          ...(isUpdateMode && existingSubmission && {
            update_existing: true,
            existing_input_id: existingSubmission.id
          })
        })
      });

      const result: UniversalInputResponse = await response.json();

      if (result.success) {
        console.log('[FormWidget] Submitted successfully:', {
          input_id: result.input_id,
          score: result.calculated_score,
          derivations: result.derivations_triggered
        });

        // Show success feedback
        const action = isUpdateMode ? 'updated' : 'submitted';
        alert(`Worksheet ${action} successfully! You earned ${result.calculated_score || 0} points.`);

        // Reset form
        setFormData({});
        onSubmit?.(result);
        onClose();
      } else {
        console.error('[FormWidget] Submission error:', result.error);
        alert(`Error submitting form: ${result.error}`);
      }
    } catch (error) {
      console.error('[FormWidget] Network error:', error);
      alert('Network error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-4 p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        <div
          className="relative rounded-2xl p-6 border border-white/20 max-h-[90vh] overflow-y-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 50%, rgba(241,245,249,0.95) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-lg font-semibold tracking-tight"
              style={{ color: 'var(--text-primary, #1e293b)' }}
            >
              {loading
                ? 'Loading Form...'
                : videoContext
                  ? `Worksheet for ${videoContext.title}`
                  : template?.name || 'Form'
              }
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors"
              style={{
                color: 'var(--text-secondary, #64748b)'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.color = 'var(--text-primary, #1e293b)';
                (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.color = 'var(--text-secondary, #64748b)';
                (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          {loading && (
            <div className="text-center py-8">
              <div style={{ color: 'var(--text-secondary, #64748b)' }}>Loading form template...</div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div style={{ color: 'var(--error-500, #ef4444)' }} className="mb-4">Error: {error}</div>
                                <button
                    onClick={onClose}
                    className="px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                    style={{
                      backgroundColor: 'var(--surface, #f8fafc)',
                      color: 'var(--text-primary, #1e293b)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--border, #e2e8f0)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--surface, #f8fafc)';
                }}
              >
                Close
              </button>
            </div>
          )}

          {template && !loading && !error && (
            <div>
              {template.description && (
                <p
                  className="text-xs mb-6"
                  style={{ color: 'var(--text-secondary, #64748b)' }}
                >
                  {template.description}
                </p>
              )}

              {/* Validation Errors Display */}
              {validationErrors.length > 0 && (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error-500, #ef4444)' }}>
                  <div className="text-xs font-medium mb-2" style={{ color: 'var(--error-500, #ef4444)' }}>
                    Please fix the following errors:
                  </div>
                  <ul className="text-xs space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} style={{ color: 'var(--error-500, #ef4444)' }}>
                        • {error.message || error.stack || 'Validation error'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Form
                schema={template.schema}
                uiSchema={template.ui_schema}
                formData={formData}
                onChange={({ formData }) => setFormData(formData)}
                onSubmit={handleSubmit}
                onError={handleError}
                validator={validator}
                widgets={customWidgets}
                templates={{
                  FieldTemplate: CustomFieldTemplate,
                  ArrayFieldTemplate: CustomArrayFieldTemplate,
                }}
                disabled={isSubmitting}
              >
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-2 py-0.5 text-xs font-medium rounded-full transition-all duration-200 opacity-90 hover:opacity-100"
                    style={{
                      backgroundColor: 'var(--primary, #3b82f6)',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.target.style.backgroundColor = 'var(--primary-hover, var(--primary, #3b82f6))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) {
                        e.target.style.backgroundColor = 'var(--primary, #3b82f6)';
                      }
                    }}
                  >
                    {isSubmitting
                      ? (isUpdateMode ? 'Updating...' : 'Submitting...')
                      : (isUpdateMode ? 'Update Worksheet' : 'Submit Worksheet')
                    }
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-2 py-0.5 text-xs font-medium rounded-full transition-all duration-200 opacity-60 hover:opacity-100"
                    style={{
                      backgroundColor: 'var(--surface, #f8fafc)',
                      color: 'var(--text-secondary, #64748b)',
                      border: '1px solid var(--border, #e2e8f0)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.target.style.backgroundColor = 'var(--border, #e2e8f0)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) {
                        e.target.style.backgroundColor = 'var(--surface, #f8fafc)';
                      }
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}