
/**
 * Re-export all organization API modules
 */
export { organizationApi } from "./organizationApiFactory";
export {
  getAllOrganizations,
  getOrganizationById,
  getOrganizationsByIds,
  createOrganization,
  updateOrganization,
  deleteOrganization
} from "./organizationApiFactory";
export { organizationRelationshipsApi } from "./relationshipsApi";

// Legacy exports for backward compatibility
export { organizationCrudApi } from "./organizationsApi";
