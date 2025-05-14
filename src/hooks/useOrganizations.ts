
// This file re-exports hooks from the new modular files
// for backwards compatibility
import { 
  useOrganizations as useOrgsQuery,
  useUserOrganizationRelationships as useRelationships,
  useOrganization
} from "./useOrganizationQueries";

export const useOrganizations = useOrgsQuery;
export const useUserOrganizationRelationships = useRelationships;
export const useOrganization = useOrganization;

export {
  useAddOrganizationRelationship,
  useUpdateOrganizationRelationship,
  useDeleteOrganizationRelationship,
  useUpdateOrganization
} from './useOrganizationMutations';
