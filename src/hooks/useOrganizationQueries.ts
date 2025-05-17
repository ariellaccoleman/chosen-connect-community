
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { useOrganizations, useOrganization, ... } from '@/hooks/organizations';
 */

// Re-export all organization queries from the modular location
export {
  useOrganizations,
  useOrganization,
  useUserOrganizationRelationships
} from "./organizations";

// Add deprecation console warning in development only
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Deprecated import: Please update imports to use modules from @/hooks/organizations directly ' +
    'instead of @/hooks/useOrganizationQueries which will be removed in a future release.'
  );
}
