
/**
 * @deprecated This file will be removed in a future release.
 * Please update your imports to use the modular structure:
 * import { organizationCrudApi, organizationRelationshipsApi } from '@/api/organizations';
 */

// Re-export from the modular location
export { organizationCrudApi } from './organizations';
export { organizationRelationshipsApi } from './organizations/relationshipsApi';

// Add deprecation console warning in development only
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Deprecated import: organizationsApi is deprecated and will be removed in a future release. ' +
    'Please use imports directly from @/api/organizations.'
  );
}
