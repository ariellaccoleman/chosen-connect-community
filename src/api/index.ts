
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

/**
 * @deprecated Legacy exports maintained for backward compatibility.
 * Please update imports to use the modular structure:
 * - import { authApi } from '@/api/auth'
 * - import { eventsApi } from '@/api/events'
 * - import { locationsApi } from '@/api/locations'
 * - import { organizationCrudApi } from '@/api/organizations'
 */
export { authApi } from './authApi';
export { eventsApi } from './eventsApi';
export { locationsApi } from './locationsApi';
export { organizationCrudApi } from './organizations';
