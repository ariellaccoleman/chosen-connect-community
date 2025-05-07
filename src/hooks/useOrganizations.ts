
// This file re-exports hooks from the new modular files
// for backwards compatibility
export { 
  useOrganizations,
  useUserOrganizationRelationships
} from './useOrganizationQueries';

export {
  useAddOrganizationRelationship,
  useUpdateOrganizationRelationship,
  useDeleteOrganizationRelationship
} from './useOrganizationMutations';
