
/**
 * Re-export API modules for easier imports
 * @file Main API entry point that provides access to all API functionalities
 */

// Core API functionality
export * from './core';

// API services
export * from './tags';
export * from './events';
export * from './locations';
export * from './profiles';
export * from './organizations';

// Export individual APIs for direct access
export { authApi } from './authApi';
export { eventsApi } from './eventsApi';
export { locationsApi } from './locationsApi';

// Note: We've removed deprecated re-exports.
// Please use the modular imports directly from their respective modules:
// - import { organizationCrudApi } from '@/api/organizations'
// - import { organizationRelationshipsApi } from '@/api/organizations'
