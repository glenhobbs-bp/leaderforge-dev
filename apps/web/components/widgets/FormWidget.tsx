/**
 * File: apps/web/components/widgets/FormWidget.tsx
 * Purpose: Schema-driven form widget using React JSON Schema Form
 * Owner: Engineering Team
 * Tags: #widgets #forms #rjsf #admin #copilotkit
 */

"use client";

import React, { useCallback, useState } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { AdminUISchema, FormDataConfig } from '../../../../packages/agent-core/types/AdminUISchema';
import { UniversalWidgetSchema } from '../../../../packages/agent-core/types/UniversalWidgetSchema';

interface FormWidgetProps {
  schema: AdminUISchema | UniversalWidgetSchema;
  onSubmit?: (data: any) => Promise<void>;
  onChange?: (data: any) => void;
}

/**
 * FormWidget - RJSF-based form rendering from schema
 * Supports JSON Schema validation and custom UI hints
 */
export const FormWidget: React.FC<FormWidgetProps> = ({
  schema,
  onSubmit,
  onChange
}) => {
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Extract form configuration from schema
  const formDataConfig = (schema.data as any).formData as FormDataConfig | undefined;
  const formConfig = (schema.config as any).formConfig;

  if (!formDataConfig?.jsonSchema) {
    return (
      <div className="p-4 text-red-600">
        Error: No JSON Schema provided for form
      </div>
    );
  }

  // Initialize form data with initial values
  React.useEffect(() => {
    if (formDataConfig.initialValues) {
      setFormData(formDataConfig.initialValues);
    }
  }, [formDataConfig.initialValues]);

  // Handle form submission
  const handleSubmit = useCallback(async ({ formData }: any) => {
    setIsSubmitting(true);
    setErrors([]);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else if (formDataConfig.submitEndpoint) {
        // Default submission to endpoint if provided
        const response = await fetch(formDataConfig.submitEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error(`Submission failed: ${response.statusText}`);
        }
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'An error occurred']);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, formDataConfig.submitEndpoint]);

  // Handle form changes
  const handleChange = useCallback(({ formData }: any) => {
    setFormData(formData);
    if (onChange) {
      onChange(formData);
    }
  }, [onChange]);

  // Custom submit button
  const submitButton = formConfig?.submitButton || {
    text: 'Submit',
    variant: 'primary',
    position: 'bottom'
  };

  return (
    <div className="form-widget">
      {schema.config.title && (
        <h2 className="text-xl font-semibold mb-4">{schema.config.title}</h2>
      )}

      {schema.config.subtitle && (
        <p className="text-gray-600 mb-4">{schema.config.subtitle}</p>
      )}

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          {errors.map((error, index) => (
            <p key={index} className="text-red-600 text-sm">{error}</p>
          ))}
        </div>
      )}

      <Form
        schema={formDataConfig.jsonSchema}
        uiSchema={formDataConfig.uiSchema || {}}
        formData={formData}
        validator={validator}
        onSubmit={handleSubmit}
        onChange={handleChange}
        disabled={isSubmitting}
        showErrorList={false}
      >
        <div className={`mt-4 flex gap-2 ${
          submitButton.position === 'top' ? 'order-first' : ''
        }`}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              submitButton.variant === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300'
                : submitButton.variant === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100'
            }`}
          >
            {isSubmitting ? 'Submitting...' : submitButton.text}
          </button>

          {formConfig?.cancelButton?.enabled && (
            <button
              type="button"
              className="px-4 py-2 rounded-md font-medium bg-gray-200 text-gray-800 hover:bg-gray-300"
              onClick={() => {
                // Reset form or close panel
                setFormData(formDataConfig.initialValues || {});
              }}
            >
              {formConfig.cancelButton.text || 'Cancel'}
            </button>
          )}
        </div>
      </Form>

      {formConfig?.progressIndicator?.enabled && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: formConfig.progressIndicator.totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index < formConfig.progressIndicator.currentStep
                  ? 'bg-blue-600'
                  : index === formConfig.progressIndicator.currentStep
                  ? 'bg-blue-400'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Schema to props transformation function for registry
export const formSchemaToProps = (schema: UniversalWidgetSchema): any => {
  return {
    schema,
    // Additional prop transformations can be added here
  };
};