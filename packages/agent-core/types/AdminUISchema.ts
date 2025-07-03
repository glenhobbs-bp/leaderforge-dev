/**
 * File: packages/agent-core/types/AdminUISchema.ts
 * Purpose: Admin-specific widget schemas for CopilotKit integration
 * Owner: Engineering Team
 * Tags: #schema #admin #copilotkit #forms #tables
 */

import { UniversalWidgetSchema, WidgetConfig, DataConfig, InteractionConfig } from './UniversalWidgetSchema';

/**
 * Admin UI Schema - Extends UniversalWidgetSchema for admin-specific widgets
 * Used by AdminAgent to generate UI for CopilotKit side-panel
 */
export interface AdminUISchema extends UniversalWidgetSchema {
  type: 'Form' | 'Table' | string;
  data: AdminDataConfig;
  config: AdminWidgetConfig;
}

/**
 * Extended data configuration for admin widgets
 */
export interface AdminDataConfig extends DataConfig {
  /** Form-specific data */
  formData?: FormDataConfig;

  /** Table-specific data */
  tableData?: TableDataConfig;
}

/**
 * Extended widget configuration for admin operations
 */
export interface AdminWidgetConfig extends WidgetConfig {
  /** Admin-specific interactions */
  adminInteractions?: AdminInteractionConfig[];

  /** Form-specific configuration */
  formConfig?: FormConfig;

  /** Table-specific configuration */
  tableConfig?: TableConfig;
}

/**
 * Form data configuration
 */
export interface FormDataConfig {
  /** JSON Schema for form structure and validation */
  jsonSchema: object;

  /** UI Schema for RJSF rendering hints */
  uiSchema?: object;

  /** Initial form values */
  initialValues?: Record<string, unknown>;

  /** Form submission endpoint */
  submitEndpoint?: string;

  /** Validation rules beyond JSON Schema */
  customValidation?: CustomValidationRule[];
}

/**
 * Table data configuration
 */
export interface TableDataConfig {
  /** Table rows data */
  rows: Record<string, unknown>[];

  /** Column definitions */
  columns: TableColumn[];

  /** Row selection configuration */
  selectionConfig?: {
    mode: 'single' | 'multiple' | 'none';
    selectedIds?: string[];
  };

  /** Pagination configuration */
  pagination?: {
    enabled: boolean;
    pageSize: number;
    currentPage: number;
    totalItems: number;
  };
}

/**
 * Form configuration options
 */
export interface FormConfig {
  /** Form layout mode */
  layout?: 'vertical' | 'horizontal' | 'inline';

  /** Submit button configuration */
  submitButton?: {
    text: string;
    variant?: 'primary' | 'secondary' | 'danger';
    position?: 'bottom' | 'top' | 'sticky';
  };

  /** Cancel button configuration */
  cancelButton?: {
    text: string;
    enabled: boolean;
  };

  /** Form sections for grouping fields */
  sections?: FormSection[];

  /** Progress indicator for multi-step forms */
  progressIndicator?: {
    enabled: boolean;
    currentStep: number;
    totalSteps: number;
  };
}

/**
 * Table configuration options
 */
export interface TableConfig {
  /** Enable sorting on columns */
  sortable?: boolean;

  /** Enable filtering */
  filterable?: boolean;

  /** Enable row actions */
  rowActions?: RowAction[];

  /** Bulk actions for selected rows */
  bulkActions?: BulkAction[];

  /** Empty state configuration */
  emptyState?: {
    message: string;
    icon?: string;
    action?: InteractionConfig;
  };
}

/**
 * Table column definition
 */
export interface TableColumn {
  /** Column identifier */
  id: string;

  /** Display header */
  header: string;

  /** Data accessor (dot notation supported) */
  accessor: string;

  /** Column type for formatting */
  type?: 'text' | 'number' | 'date' | 'boolean' | 'status' | 'action';

  /** Column width configuration */
  width?: number | 'auto';

  /** Sortable flag */
  sortable?: boolean;

  /** Custom cell renderer */
  cellRenderer?: string;
}

/**
 * Form section for grouping fields
 */
export interface FormSection {
  /** Section identifier */
  id: string;

  /** Section title */
  title: string;

  /** Section description */
  description?: string;

  /** Fields in this section */
  fields: string[];

  /** Collapsible configuration */
  collapsible?: boolean;

  /** Initially collapsed */
  collapsed?: boolean;
}

/**
 * Custom validation rule
 */
export interface CustomValidationRule {
  /** Field to validate */
  field: string;

  /** Validation type */
  type: 'custom' | 'async' | 'cross-field';

  /** Validation function name (resolved at runtime) */
  validator: string;

  /** Error message */
  message: string;
}

/**
 * Row action configuration
 */
export interface RowAction {
  /** Action identifier */
  id: string;

  /** Display label */
  label: string;

  /** Icon identifier */
  icon?: string;

  /** Action type */
  action: AdminInteractionConfig;

  /** Visibility condition */
  condition?: string;
}

/**
 * Bulk action configuration
 */
export interface BulkAction {
  /** Action identifier */
  id: string;

  /** Display label */
  label: string;

  /** Icon identifier */
  icon?: string;

  /** Action type */
  action: AdminInteractionConfig;

  /** Confirmation required */
  requiresConfirmation?: boolean;
}

/**
 * Admin-specific interaction configuration
 */
export interface AdminInteractionConfig extends InteractionConfig {
  /** Admin action type */
  adminAction?: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'custom';

  /** Required permission */
  requiredPermission?: string;

  /** Confirmation configuration */
  confirmation?: {
    required: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  };
}

/**
 * Admin task context for multi-step flows
 */
export interface AdminTaskContext {
  /** Task identifier */
  taskId: string;

  /** Current step in the flow */
  currentStep: string;

  /** Task state data */
  state: Record<string, unknown>;

  /** Task history */
  history: TaskHistoryEntry[];
}

/**
 * Task history entry
 */
export interface TaskHistoryEntry {
  /** Step identifier */
  step: string;

  /** Timestamp */
  timestamp: string;

  /** Action taken */
  action: string;

  /** Result data */
  result?: Record<string, unknown>;
}