
/**
 * Re-export all organization related hooks - Updated to use factory pattern
 */

// Export factory-based hooks to prevent direct repository instantiation
export * from './useOrganizationFactoryHooks';

// Export organization admin hooks
export {
  useOrganizationAdmins,
  useOrganizationAdminsByOrg,
  useUserAdminRequests,
  useIsOrganizationAdmin,
  usePendingOrganizationAdmins,
  useOrganizationRole,
  useCreateAdminRequest,
  useUpdateAdminRequest,
  useDeleteAdminRequest
} from "./useOrganizationAdminHooks";

// Export relationship hooks
export * from "./useOrganizationRelationshipHooks";

// Legacy exports (deprecated, but kept for backward compatibility)
export {
  useOrganizations as useOrganizationsLegacy,
  useOrganization as useOrganizationLegacy,
  useUserOrganizationRelationships as useUserOrganizationRelationshipsLegacy,
  useCreateOrganizationWithRelationships
} from "./useOrganizationHooks";
