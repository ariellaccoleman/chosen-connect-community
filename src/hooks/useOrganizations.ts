
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { useOrganizations, useOrganization, ... } from '@/hooks/organizations';
 */

import { 
  useOrganizations as useOrgsQuery,
  useUserOrganizationRelationships as useRelationships,
  useOrganization as useOrganizationQuery
} from "./organizations";

/**
 * @deprecated Use useOrganizations from '@/hooks/organizations' directly
 */
export const useOrganizations = useOrgsQuery;

/**
 * @deprecated Use useUserOrganizationRelationships from '@/hooks/organizations' directly
 */
export const useUserOrganizationRelationships = useRelationships;

/**
 * @deprecated Use useOrganization from '@/hooks/organizations' directly
 */
export const useOrganization = useOrganizationQuery;

// Re-export mutation hooks for backward compatibility
export {
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useAddOrganizationRelationship,
  useUpdateOrganizationRelationship,
  useDeleteOrganizationRelationship
} from './useOrganizationMutations';
