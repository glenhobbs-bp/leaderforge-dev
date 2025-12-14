import { useMutation } from '@tanstack/react-query';
import { provisionAction } from '../lib/apiClient/provisioning';

/**
 * React Query mutation hook for provisioning actions.
 */
export function useProvisioningAction() {
  return useMutation({
    mutationFn: ({ action, payload }: { action: 'inviteUser' | 'grantEntitlement' | 'revokeEntitlement'; payload: any }) =>
      provisionAction(action, payload),
    onSuccess: (data) => console.log('[hook] useProvisioningAction success:', data),
    onError: (err) => console.error('[hook] useProvisioningAction error:', err),
  });
}

// TODO: Add test coverage for this hook.