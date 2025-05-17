
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { useOrganizationAdmins, ... } from '@/hooks/organizations';
 */

// Re-export all organization admin query hooks from the modular location
export {
  useOrganizationAdmins,
  useOrganizationAdminsByOrg,
  useUserAdminRequests,
  useIsOrganizationAdmin,
  usePendingOrganizationAdmins,
  useOrganizationRole
} from './organizations';

// Add deprecation console warning in development only
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Deprecated import: Please update imports to use modules from @/hooks/organizations directly ' +
    'instead of @/hooks/useOrganizationAdminQueries which will be removed in a future release.'
  );
}
