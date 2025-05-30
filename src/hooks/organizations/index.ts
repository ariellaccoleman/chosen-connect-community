
/**
 * Re-export all organization related hooks - Factory pattern only
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
export {
  useCreateOrganizationRelationship,
  useUpdateOrganizationRelationship,
  useDeleteOrganizationRelationship,
  useOrganizationRelationshipsForProfile,
  useProfileRelationshipsForOrganization,
  useGetAllOrganizationRelationships,
  useGetOrganizationRelationshipById,
  useGetOrganizationRelationshipsByIds
} from "./useOrganizationRelationshipHooks";

// Add the missing hook alias for backward compatibility
export { useCreateOrganizationRelationship as useCreateOrganizationWithRelationships } from "./useOrganizationRelationshipHooks";
