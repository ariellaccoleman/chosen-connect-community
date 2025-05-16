
// Re-export all organization queries from the new module for backwards compatibility
export {
  useOrganizations,
  useOrganization,
  useUserOrganizationRelationships
} from "./organizations";

// Legacy export for organization queries
export const useOrganizationQueries = () => {
  const {
    useOrganizations,
  } = require('./organizations');
  
  // For backward compatibility
  const useFilterTags = require('./useTagQueries').useFilterTags;
  
  return {
    useOrganizations: useOrganizations,
    useFilterTags,
  };
};
