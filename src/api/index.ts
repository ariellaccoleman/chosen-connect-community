
/**
 * Re-export API modules for easier imports
 */

// Core API functionality
export * from './core';

// API services
export * from './tags';
export * from './events';

// Legacy exports
export { authApi } from './authApi';
export { eventsApi } from './eventsApi';
export { locationsApi } from './locationsApi';
export { organizationCrudApi } from './organizations';
