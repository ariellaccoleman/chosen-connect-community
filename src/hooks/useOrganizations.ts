
// This file re-exports hooks from the new modular files
// for backwards compatibility
import { 
  useOrganizations as useOrgsQuery,
  useUserOrganizationRelationships as useRelationships 
} from "./useOrganizationQueries";

export const useOrganizations = useOrgsQuery;
export const useUserOrganizationRelationships = useRelationships;

export {
  useAddOrganizationRelationship,
  useUpdateOrganizationRelationship,
  useDeleteOrganizationRelationship
} from './useOrganizationMutations';
