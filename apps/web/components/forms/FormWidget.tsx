"use client";

/**
 * Purpose: Schema-driven form widget using React JSON Schema Form with custom LeaderForge design system styling
 * Owner: Universal Input System
 * Tags: [form, widget, rjsf, schema-driven, universal-input, design-system]
 */

import React, { useState, useEffect, useRef } from 'react';
import Form, { IChangeEvent } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema, UiSchema, WidgetProps, FieldTemplateProps, ArrayFieldTemplateProps, RJSFValidationError } from '@rjsf/utils';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

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
  title?: string;
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
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = 'var(--border, #e2e8f0)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = 'var(--surface, #f8fafc)';
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

export function FormWidget({ templateId, isOpen, onClose, videoContext }: FormWidgetProps) {
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [validationErrors, setValidationErrors] = useState<RJSFValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [banner, setBanner] = useState<{ message: string; type: 'success' | 'error'; visible: boolean } | null>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    if (fetchingRef.current) return; // Skip if already fetching

    console.log('[FormWidget] useEffect triggered - templateId:', templateId, 'videoContext:', videoContext);

    const fetchTemplate = async () => {
      try {
        fetchingRef.current = true;
        setLoading(true);
        setError(null);

        console.log('[FormWidget] Fetching template:', templateId);
        const response = await fetch(`/api/form-templates/${templateId}`, {
          credentials: 'include'
        });
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
          console.log('[FormWidget] Checking for existing submission with videoContext:', videoContext);
          await checkExistingSubmission();
        } else {
          console.log('[FormWidget] No videoContext provided, skipping existing submission check');
        }
      } catch (err) {
        console.error('[FormWidget] Error fetching template:', err);
        setError(err instanceof Error ? err.message : 'Failed to load form template');
      } finally {
        setLoading(false);
        fetchingRef.current = false; // Reset fetching flag
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
    console.log('[FormWidget] Validation errors:', errors);
    setValidationErrors(errors);
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
          content_title: videoContext.title,  // ✅ Use content title as primary identifier
          video_id: videoContext.id,          // Keep for backward compatibility
          video_title: videoContext.title,
          video_context: {
            id: videoContext.id,
            title: videoContext.title
          }
        })
      };

      // Create source context using content title (deterministic identifier)
      const sourceContext = videoContext
        ? `worksheet:video-reflection:${videoContext.title}:${templateId}`
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

                // Show success feedback - only award points for first-time completion
        if (isUpdateMode) {
          // No points shown for updates - they already earned them
          console.log('[FormWidget] Success: Worksheet updated successfully!');
          showBanner('Worksheet updated successfully!');
          // showToast('Worksheet updated successfully!'); // Commented for comparison
        } else {
          // Only show points for first-time completion
          console.log(`[FormWidget] Success: Worksheet completed! Earned ${result.calculated_score || 0} points.`);
          showBanner(`Great work! You completed the worksheet and earned ${result.calculated_score || 0} points.`);
          // showToast(`Great work! You completed the worksheet and earned ${result.calculated_score || 0} points.`); // Commented for comparison
        }

                // Reset form
        setFormData({});

        // ✅ Delay closing modal to show banner and allow fade out
        setTimeout(() => {
          onClose();
        }, 3000); // 2.5 seconds for banner display + 0.5 seconds for fade out
      } else {
        console.error('[FormWidget] Submission error:', result.error);
        showBanner(`Error submitting form: ${result.error}`, 'error');
        // ✅ Delay closing modal to show error banner and allow fade out
        setTimeout(() => {
          onClose();
        }, 3500); // 3 seconds for error display + 0.5 seconds for fade out
      }
    } catch (error) {
      console.error('[FormWidget] Network error:', error);
      showBanner('Network error submitting form. Please try again.', 'error');
      // ✅ Delay closing modal to show error banner and allow fade out
      setTimeout(() => {
        onClose();
      }, 3500); // 3 seconds for error display + 0.5 seconds for fade out
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toast function - commented out for banner comparison
  // const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  //   setToast({ message, type, visible: true });
  //   setTimeout(() => {
  //     setToast(prev => prev ? { ...prev, visible: false } : null);
  //     setTimeout(() => setToast(null), 300); // Remove after fade out
  //   }, 3000);
  // };

  const showBanner = (message: string, type: 'success' | 'error' = 'success') => {
    setBanner({ message, type, visible: true });
    setTimeout(() => {
      setBanner(prev => prev ? { ...prev, visible: false } : null);
      setTimeout(() => setBanner(null), 400); // Remove after fade out
    }, 4000); // Show banner a bit longer than toast
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
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
            style={{
              color: 'var(--text-secondary, #64748b)'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.color = 'var(--text-primary, #1e293b)';
              target.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.color = 'var(--text-secondary, #64748b)';
              target.style.backgroundColor = 'transparent';
            }}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Banner Notification */}
          {banner && banner.visible && (
            <div
              className={`mb-4 px-4 py-3 rounded-lg border transition-all duration-500 ease-out transform ${
                banner.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              } animate-in slide-in-from-top-2 fade-in-0 scale-in-95`}
              style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center gap-2">
                {banner.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="font-medium">{banner.message}</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              {/* Elegant Spinner */}
              <div
                className="w-8 h-8 border-2 rounded-full mb-6 animate-spin"
                style={{
                  borderColor: 'var(--border, #e2e8f0)',
                  borderTopColor: 'var(--primary, #3b82f6)',
                  animation: 'spin 1s linear infinite'
                }}
              />

              {/* Loading Text */}
              <div className="text-center">
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: 'var(--text-primary, #1e293b)' }}
                >
                  Loading your worksheet...
                </h3>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary, #64748b)' }}
                >
                  Preparing your personalized reflection questions
                  <span className="animate-pulse">...</span>
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Worksheet</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Form Content */}
          {template && !loading && !error && (
            <>
              <div className="mb-6">
                <h2
                  className="text-xl font-semibold mb-2"
                  style={{ color: 'var(--text-primary, #1e293b)' }}
                >
                  {template.title || 'Video Reflection Worksheet'}
                </h2>
                {template.description && (
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--text-secondary, #64748b)' }}
                  >
                    {template.description}
                  </p>
                )}
                {videoContext && (
                  <div
                    className="mt-3 px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--surface-secondary, rgba(59, 130, 246, 0.1))',
                      color: 'var(--primary, #3b82f6)',
                      border: '1px solid var(--primary-light, rgba(59, 130, 246, 0.2))'
                    }}
                  >
                    <span className="font-medium">Video:</span> {videoContext.title}
                  </div>
                )}
              </div>

              <Form
                schema={template.schema}
                uiSchema={template.ui_schema}
                formData={formData}
                onChange={({ formData: newData }) => setFormData(newData || {})}
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
                      : (isUpdateMode ? 'Update Worksheet' : 'Complete Worksheet')
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}