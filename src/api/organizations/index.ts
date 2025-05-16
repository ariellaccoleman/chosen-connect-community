
/**
 * Organizations API module - provides functionality for working with organizations
 * @module api/organizations
 */

// Re-export all organization API modules
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

/**
 * @deprecated Legacy exports maintained for backward compatibility.
 * Please use organizationApi directly.
 */
export { organizationCrudApi } from "./organizationsApi";

