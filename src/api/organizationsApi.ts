
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { organizationApi } from '@/api/organizations';
 * import { organizationRelationshipsApi } from '@/api/organizations';
 */

export { organizationCrudApi as organizationsApi } from './organizations/organizationsApi';
export { organizationRelationshipsApi } from './organizations/relationshipsApi';

// Add deprecation console warning in development only
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Deprecated import: organizationsApi is deprecated and will be removed in a future release. ' +
    'Please use imports from @/api/organizations directly.'
  );
}
