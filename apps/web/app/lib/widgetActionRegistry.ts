/**
 * File: apps/web/app/lib/widgetActionRegistry.ts
 * Purpose: Centralized registry for widget action handlers - removes hardcoded switch statements
 * Owner: Frontend team
 * Tags: widget, actions, registry, architecture
 */

export interface ActionData {
  action: string;
  label: string;
  [key: string]: unknown;
}

export type ActionHandler = (action: ActionData) => Promise<void> | void;

/**
 * Registry for widget action handlers.
 * Eliminates the need for hardcoded switch statements in DynamicTenantPage.
 * Enables atomic widget development - each widget can register its own handlers.
 */
export class WidgetActionRegistry {
  private handlers = new Map<string, ActionHandler>();

  /**
   * Register an action handler
   */
  register(actionType: string, handler: ActionHandler): void {
    this.handlers.set(actionType, handler);
  }

  /**
   * Unregister an action handler
   */
  unregister(actionType: string): void {
    this.handlers.delete(actionType);
  }

  /**
   * Handle an action by dispatching to the registered handler
   */
  async handle(action: ActionData): Promise<void> {
    const handler = this.handlers.get(action.action);

    if (!handler) {
      console.warn(`[WidgetActionRegistry] No handler registered for action: ${action.action}`);
      return;
    }

    try {
      await handler(action);
    } catch (error) {
      console.error(`[WidgetActionRegistry] Error handling action ${action.action}:`, error);
      throw error;
    }
  }

  /**
   * Get all registered action types
   */
  getRegisteredActions(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if an action type is registered
   */
  hasHandler(actionType: string): boolean {
    return this.handlers.has(actionType);
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Default singleton instance
export const defaultActionRegistry = new WidgetActionRegistry();

// Pre-register existing widget action handlers for backward compatibility
export function initializeDefaultHandlers(callbacks?: {
  setVideoModalData?: (data: ActionData) => void;
  setIsVideoModalOpen?: (open: boolean) => void;
  setWorksheetModalData?: (data: {
    contentId: string;
    title: string;
    templateId?: string;
    agentReasoning?: string;
    contentAnalysis?: string;
    [key: string]: unknown;
  }) => void;
  setIsWorksheetModalOpen?: (open: boolean) => void;
}) {
  // Video modal actions
  defaultActionRegistry.register('openVideoModal', async (action) => {
    console.log('[DynamicTenantPage] Opening video modal:', action);
    if (callbacks?.setVideoModalData && callbacks?.setIsVideoModalOpen) {
      callbacks.setVideoModalData(action);
      callbacks.setIsVideoModalOpen(true);
    }
  });

  // Worksheet modal actions
  defaultActionRegistry.register('openWorksheet', async (action) => {
    console.log('[DynamicTenantPage] Opening worksheet with action:', JSON.stringify(action, null, 2));
    const actionParams = action.parameters as Record<string, unknown>;

    // Phase 2: Agent-driven template selection with observability
    const agentReasoning = actionParams?.reasoning as string;
    const contentAnalysis = actionParams?.contentAnalysis as string;

    if (agentReasoning || contentAnalysis) {
      console.log('[DynamicTenantPage] Agent template selection:', {
        templateId: actionParams?.templateId,
        reasoning: agentReasoning,
        contentAnalysis: contentAnalysis
      });
    }

    if (callbacks?.setWorksheetModalData && callbacks?.setIsWorksheetModalOpen) {
      callbacks.setWorksheetModalData({
        contentId: (action.contentId as string) || (actionParams?.contentId as string) || 'unknown',
        title: (action.title as string) || (actionParams?.title as string) || 'Content Worksheet',
        templateId: (action.templateId as string) || (actionParams?.templateId as string) || '663570eb-babd-41cd-9bfa-18972275863b',
        // Phase 2: Include agent decision metadata for observability
        agentReasoning,
        contentAnalysis
      });
      callbacks.setIsWorksheetModalOpen(true);
    }
  });

  // Progress tracking actions
  defaultActionRegistry.register('completeProgress', async (action) => {
    console.log('[DynamicTenantPage] Completing progress:', action);
    // TODO: Implement progress completion
  });

  console.log('[WidgetActionRegistry] Initialized with default handlers:', defaultActionRegistry.getRegisteredActions());
}