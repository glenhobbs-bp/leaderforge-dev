/**
 * File: packages/services/src/types.ts
 * Purpose: Shared service types
 * Owner: Core Team
 */

/**
 * Standard service error
 */
export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Standard service result wrapper
 */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError };

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * User context for service calls
 */
export interface UserContext {
  userId: string;
  tenantId: string;
  organizationId: string | null;
  teamId: string | null;
  role: 'member' | 'manager' | 'admin' | 'owner';
}

