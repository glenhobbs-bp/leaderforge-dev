/**
 * File: packages/services/src/index.ts
 * Purpose: Service layer exports
 * Owner: Core Team
 */

// Export all services
export * from './auth.service';
export * from './user.service';
export * from './organization.service';
export * from './team.service';
export * from './content.service';
export * from './progress.service';
export * from './gamification.service';

// Export types
export type { ServiceResult, ServiceError } from './types';

