/**
 * File: packages/agent-core/agents/AdminAgent.ts
 * Purpose: Admin agent for orchestrating privileged admin operations
 * Owner: Engineering Team
 * Tags: #agents #admin #copilotkit #langgraph
 */

import { AdminUISchema } from '../types/AdminUISchema';

export interface AdminAgentContext {
  userId: string;
  tenantKey: string;
  isAdmin: boolean;
  intent: string;
  currentStep?: string;
  state?: Record<string, unknown>;
}

export interface AdminAgentResponse {
  schema: AdminUISchema;
  taskId: string;
  nextStep?: string;
  completed?: boolean;
  error?: string;
}

/**
 * AdminAgent - Orchestrates admin operations and returns UI schemas
 * Works with CopilotKit to handle admin intents
 */
export class AdminAgent {
  constructor() {
    // Tool integration will be added when tools are implemented
  }

  /**
   * Process admin intent and return appropriate UI schema
   */
  async processIntent(context: AdminAgentContext): Promise<AdminAgentResponse> {
    // Validate admin permissions
    if (!context.isAdmin) {
      return {
        taskId: 'unauthorized',
        schema: this.createErrorSchema('Unauthorized', 'You do not have admin permissions.'),
        error: 'Unauthorized access'
      };
    }

    // Parse intent to determine action
    const action = this.parseIntent(context.intent);

    switch (action.type) {
      case 'configure-entitlements':
        return this.handleEntitlementConfiguration(context, action);

      case 'create-tenant':
        return this.handleTenantCreation(context, action);

      case 'change-theme':
        return this.handleThemeChange(context, action);

      default:
        return {
          taskId: 'unknown-intent',
          schema: this.createErrorSchema(
            'Unknown Request',
            `I don't understand the request: "${context.intent}"`
          ),
          error: 'Unknown intent'
        };
    }
  }

  /**
   * Parse user intent to determine action type
   */
  private parseIntent(intent: string): { type: string; params: Record<string, unknown> } {
    const lowerIntent = intent.toLowerCase();

    // Entitlement patterns - also check for "change entitlements"
    if (lowerIntent.includes('entitlement') || lowerIntent.includes('permission') ||
        (lowerIntent.includes('change') && lowerIntent.includes('entitlement'))) {
      // Try to extract email or user ID from the intent
      const emailMatch = intent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const userMatch = intent.match(/user[:\s]+([^\s]+)/i);
      const forUserMatch = intent.match(/for\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[^\s]+)/i);

      return {
        type: 'configure-entitlements',
        params: {
          userId: emailMatch?.[1] || userMatch?.[1] || forUserMatch?.[1] || ''
        }
      };
    }

    // Tenant creation patterns
    if (lowerIntent.includes('tenant') || lowerIntent.includes('organization')) {
      const nameMatch = intent.match(/tenant[:\s]+([^,\n]+)/i) ||
                       intent.match(/organization[:\s]+([^,\n]+)/i);
      return {
        type: 'create-tenant',
        params: {
          tenantName: nameMatch?.[1]?.trim() || ''
        }
      };
    }

    // Theme change patterns
    if (lowerIntent.includes('theme') || lowerIntent.includes('color')) {
      const colorMatch = intent.match(/#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/);
      return {
        type: 'change-theme',
        params: {
          color: colorMatch?.[0] || ''
        }
      };
    }

    return {
      type: 'unknown',
      params: {}
    };
  }

  /**
   * Handle entitlement configuration request
   */
  private async handleEntitlementConfiguration(
    context: AdminAgentContext,
    action: { params: Record<string, unknown> }
  ): Promise<AdminAgentResponse> {
    const taskId = `entitlements-${Date.now()}`;
    const targetUserId = action.params.userId as string || '';

    // Import the EntitlementTool
    const { EntitlementTool } = await import('../tools/EntitlementTool');

    // Fetch real entitlements from the database
    const availableEntitlements = await EntitlementTool.getAvailableEntitlements();
    const currentEntitlements = targetUserId ? await EntitlementTool.getUserEntitlements(targetUserId) : [];

    // If no available entitlements exist, show helpful message
    if (availableEntitlements.length === 0) {
      return {
        taskId,
        schema: this.createErrorSchema(
          'No Entitlements Available',
          'No entitlements are currently defined in the system. Please create entitlements in the core.entitlements table first.'
        ),
        error: 'No entitlements available'
      };
    }

    // Step 1: Show current entitlements first (Discovery Phase)
    if (!targetUserId) {
      const schema: AdminUISchema = {
        type: 'Form',
        id: `entitlements-lookup-${taskId}`,
        version: '1.0',
        data: {
          source: 'admin-entitlements-lookup',
          formData: {
            jsonSchema: {
              type: 'object',
              title: 'User Entitlements Lookup',
              description: 'First, let\'s see what entitlements this user currently has',
              properties: {
                userId: {
                  type: 'string',
                  title: 'User Email or ID',
                  description: 'Enter the email address or user ID to view current entitlements',
                  pattern: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$|^[a-fA-F0-9-]{36}$'
                }
              },
              required: ['userId']
            },
            uiSchema: {
              userId: {
                'ui:placeholder': 'user@example.com or user-id',
                'ui:help': 'We\'ll show their current entitlements first, then you can modify them'
              }
            },
            initialValues: {}
          }
        },
        config: {
          title: 'Entitlement Management',
          subtitle: 'Step 1: Lookup Current Entitlements',
          formConfig: {
            submitButton: {
              text: 'View Current Entitlements',
              variant: 'primary'
            }
          }
        }
      };

      return {
        taskId,
        schema,
        nextStep: 'lookup-user'
      };
    }

    // Step 2: Show current state with modification interface
    // Create entitlement options with current state indicators
    const entitlementOptions = availableEntitlements.map(e => ({
      value: e.id,
      label: e.display_name,
      description: e.description || 'No description available',
      tenant: e.tenant_key,
      isCurrentlyAssigned: currentEntitlements.includes(e.id)
    }));

    const schema: AdminUISchema = {
      type: 'Form',
      id: `entitlements-modify-${taskId}`,
      version: '1.0',
      data: {
        source: 'admin-entitlements-modify',
        formData: {
          jsonSchema: {
            type: 'object',
            title: `Entitlements for ${targetUserId}`,
            description: `Current entitlements are pre-selected. Check/uncheck to modify.`,
            properties: {
              userId: {
                type: 'string',
                title: 'User',
                default: targetUserId,
                readOnly: true
              },
              currentEntitlements: {
                type: 'array',
                title: 'Current Entitlements',
                description: `This user currently has ${currentEntitlements.length} entitlement(s)`,
                items: {
                  type: 'string'
                },
                default: currentEntitlements,
                readOnly: true
              },
              newEntitlements: {
                type: 'array',
                title: 'Select Entitlements',
                description: 'Check the entitlements this user should have. Currently assigned entitlements are pre-selected.',
                items: {
                  type: 'string',
                  enum: entitlementOptions.map(e => e.value),
                  enumNames: entitlementOptions.map(e =>
                    `${e.label}${e.isCurrentlyAssigned ? ' ✓ (currently assigned)' : ''} - ${e.description}`
                  )
                },
                default: currentEntitlements,
                uniqueItems: true
              }
            },
            required: ['userId', 'newEntitlements']
          },
          uiSchema: {
            userId: {
              'ui:widget': 'text',
              'ui:readonly': true,
              'ui:description': 'User being modified'
            },
            currentEntitlements: {
              'ui:widget': 'hidden'
            },
            newEntitlements: {
              'ui:widget': 'checkboxes',
              'ui:options': {
                inline: false
              },
              'ui:help': 'Changes will be applied when you submit this form'
            }
          },
          initialValues: {
            userId: targetUserId,
            currentEntitlements: currentEntitlements,
            newEntitlements: currentEntitlements
          }
        }
      },
      config: {
        title: 'Modify User Entitlements',
        subtitle: `Step 2: Update entitlements for ${targetUserId}`,
        formConfig: {
          submitButton: {
            text: 'Update Entitlements',
            variant: 'primary'
          },
          cancelButton: {
            text: 'Cancel',
            enabled: true
          }
        }
      }
    };

    return {
      taskId,
      schema,
      nextStep: 'confirm-changes'
    };
  }

  /**
   * Handle tenant creation request
   */
  private async handleTenantCreation(
    context: AdminAgentContext,
    action: { params: Record<string, unknown> }
  ): Promise<AdminAgentResponse> {
    const taskId = `tenant-${Date.now()}`;
    const tenantName = action.params.tenantName as string || '';

    const schema: AdminUISchema = {
      type: 'Form',
      id: `tenant-form-${taskId}`,
      version: '1.0',
      data: {
        source: 'admin-tenant',
        formData: {
          jsonSchema: {
            type: 'object',
            title: 'Create New Tenant',
            properties: {
              name: {
                type: 'string',
                title: 'Tenant Name',
                minLength: 3,
                maxLength: 50
              },
              slug: {
                type: 'string',
                title: 'URL Slug',
                pattern: '^[a-z0-9-]+$',
                description: 'Lowercase letters, numbers, and hyphens only'
              },
              primaryColor: {
                type: 'string',
                title: 'Primary Color',
                default: '#3B82F6'
              },
              logo: {
                type: 'string',
                title: 'Logo URL',
                format: 'uri'
              }
            },
            required: ['name', 'slug']
          },
          uiSchema: {
            name: {
              'ui:autofocus': true
            },
            slug: {
              'ui:help': 'This will be used in URLs: example.com/[slug]'
            },
            primaryColor: {
              'ui:widget': 'color'
            }
          },
          initialValues: {
            name: tenantName,
            slug: tenantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          },
          submitEndpoint: '/api/agent/admin'
        }
      },
      config: {
        title: 'Create New Tenant',
        subtitle: 'Set up a new tenant organization',
        formConfig: {
          submitButton: {
            text: 'Create Tenant',
            variant: 'primary'
          },
          cancelButton: {
            text: 'Cancel',
            enabled: true
          }
        }
      }
    };

    return {
      taskId,
      schema
    };
  }

  /**
   * Handle theme change request
   */
  private async handleThemeChange(
    context: AdminAgentContext,
    action: { params: Record<string, unknown> }
  ): Promise<AdminAgentResponse> {
    const taskId = `theme-${Date.now()}`;
    const primaryColor = action.params.primaryColor as string || '';

    const schema: AdminUISchema = {
      type: 'Form',
      id: `theme-form-${taskId}`,
      version: '1.0',
      data: {
        source: 'admin-theme',
        formData: {
          jsonSchema: {
            type: 'object',
            title: 'Theme Configuration',
            properties: {
              primaryColor: {
                type: 'string',
                title: 'Primary Color'
              },
              secondaryColor: {
                type: 'string',
                title: 'Secondary Color'
              },
              backgroundColor: {
                type: 'string',
                title: 'Background Color'
              },
              textColor: {
                type: 'string',
                title: 'Text Color'
              }
            },
            required: ['primaryColor']
          },
          uiSchema: {
            primaryColor: {
              'ui:widget': 'color',
              'ui:autofocus': true
            },
            secondaryColor: {
              'ui:widget': 'color'
            },
            backgroundColor: {
              'ui:widget': 'color'
            },
            textColor: {
              'ui:widget': 'color'
            }
          },
          initialValues: {
            primaryColor: primaryColor || '#3B82F6',
            secondaryColor: '#6366F1',
            backgroundColor: '#FFFFFF',
            textColor: '#111827'
          },
          submitEndpoint: '/api/agent/admin'
        }
      },
      config: {
        title: 'Update Theme Colors',
        subtitle: `Customize the color scheme for ${context.tenantKey}`,
        formConfig: {
          submitButton: {
            text: 'Apply Theme',
            variant: 'primary'
          },
          cancelButton: {
            text: 'Cancel',
            enabled: true
          }
        }
      }
    };

    return {
      taskId,
      schema
    };
  }

  /**
   * Create error schema for displaying errors
   */
  private createErrorSchema(title: string, message: string): AdminUISchema {
    return {
      type: 'Panel',
      id: 'error-panel',
      version: '1.0',
      data: {
        source: 'error',
        staticContent: {
          message
        }
      },
      config: {
        title,
        displayMode: 'compact',
        custom: {
          variant: 'error'
        }
      }
    };
  }
}