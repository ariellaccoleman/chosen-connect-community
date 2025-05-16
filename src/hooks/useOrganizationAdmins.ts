
// This file re-exports all organization admin hooks for backwards compatibility
export {
  useOrganizationAdmins,
  useOrganizationAdminsByOrg,
  useUserAdminRequests,
  useIsOrganizationAdmin,
  usePendingOrganizationAdmins,
  useOrganizationRole
} from './organizations';

export {
  useCreateAdminRequest,
  useUpdateAdminRequest,
  useDeleteAdminRequest
} from './organizations';

