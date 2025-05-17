
/**
 * Organizations API module - provides exports for all organization-related APIs
 * @module api/organizations
 */

// Export all organization-related APIs
export * from './organizationCrudApi';
export * from './organizationUpdateApi';
export * from './organizationCreateApi';
export * from './relationshipsApi';
export * from './organizationApiFactory';

// Export an alias for backwards compatibility
export { organizationCrudApi } from './organizationsApi';

