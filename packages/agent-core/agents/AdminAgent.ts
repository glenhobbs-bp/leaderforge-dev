/**
 * File: packages/agent-core/agents/AdminAgent.ts
 * Purpose: Admin agent for orchestrating privileged admin operations
 * Owner: Engineering Team
 * Tags: #agents #admin #copilotkit #langgraph
 */

import { AdminUISchema } from '../types/AdminUISchema';
import { ToolRegistry } from '../tools/ToolRegistry';

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
  private toolRegistry: ToolRegistry;

  constructor() {
    this.toolRegistry = new ToolRegistry();
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

    // Entitlement patterns
    if (lowerIntent.includes('entitlement') || lowerIntent.includes('permission')) {
      const userMatch = intent.match(/user[:\s]+([^\s]+)/i);
      return {
        type: 'configure-entitlements',
        params: {
          userId: userMatch?.[1]
        }
      };
    }

    // Tenant creation patterns
    if (lowerIntent.includes('create tenant') || lowerIntent.includes('new tenant')) {
      const nameMatch = intent.match(/(?:tenant|named?)[:\s]+["']?([^"']+)["']?/i);
      return {
        type: 'create-tenant',
        params: {
          tenantName: nameMatch?.[1]
        }
      };
    }

    // Theme change patterns
    if (lowerIntent.includes('theme') || lowerIntent.includes('color')) {
      const colorMatch = intent.match(/(?:primary|color)[:\s]+([#\w]+)/i);
      return {
        type: 'change-theme',
        params: {
          primaryColor: colorMatch?.[1]
        }
      };
    }

    return { type: 'unknown', params: {} };
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

    // Get current entitlements from tool
    const entitlementTool = this.toolRegistry.getTool('EntitlementTool');
    let currentEntitlements: string[] = [];

    if (entitlementTool && targetUserId) {
      try {
        const result = await entitlementTool.execute('getEntitlements', { userId: targetUserId });
        currentEntitlements = result.entitlements || [];
      } catch (error) {
        console.error('Failed to fetch entitlements:', error);
      }
    }

    const schema: AdminUISchema = {
      type: 'Form',
      id: `entitlements-form-${taskId}`,
      version: '1.0',
      data: {
        source: 'admin-entitlements',
        formData: {
          jsonSchema: {
            type: 'object',
            title: 'User Entitlements',
            properties: {
              userId: {
                type: 'string',
                title: 'User ID',
                description: 'The user to configure entitlements for'
              },
              entitlements: {
                type: 'array',
                title: 'Entitlements',
                items: {
                  type: 'string',
                  enum: [
                    'basic_access',
                    'premium_content',
                    'analytics_view',
                    'team_management',
                    'api_access',
                    'custom_branding'
                  ]
                },
                uniqueItems: true
              }
            },
            required: ['userId', 'entitlements']
          },
          uiSchema: {
            userId: {
              'ui:autofocus': true,
              'ui:help': 'Enter the user ID or email'
            },
            entitlements: {
              'ui:widget': 'checkboxes'
            }
          },
          initialValues: {
            userId: targetUserId,
            entitlements: currentEntitlements
          },
          submitEndpoint: '/api/agent/admin'
        }
      },
      config: {
        title: 'Configure User Entitlements',
        subtitle: `Set permissions and access levels for ${targetUserId || 'user'}`,
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
      nextStep: 'confirm'
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