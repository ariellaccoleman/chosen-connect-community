
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

// Re-export organization admin API
export {
  organizationAdminApi,
  getAllOrganizationAdmins,
  getOrganizationAdminsByOrg,
  getUserAdminRequests,
  checkIsOrganizationAdmin,
  getOrganizationRole,
  createAdminRequest,
  updateAdminRequest,
  deleteAdminRequest
} from "./organizationAdminApiFactory";
