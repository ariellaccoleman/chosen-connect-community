
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { useCreateOrganization, useUpdateOrganization, ... } from '@/hooks/organizations';
 */

// Re-export all organization mutation hooks from the modular location
export {
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useAddOrganizationRelationship,
  useUpdateOrganizationRelationship,
  useDeleteOrganizationRelationship
} from './organizations';

// Add deprecation console warning in development only
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Deprecated import: Please update imports to use modules from @/hooks/organizations directly ' +
    'instead of @/hooks/useOrganizationMutations which will be removed in a future release.'
  );
}
