
// This file re-exports all organization admin hooks for backwards compatibility
export {
  useOrganizationAdmins,
  useOrganizationAdminsByOrg,
  useUserAdminRequests,
  useIsOrganizationAdmin
} from './useOrganizationAdminQueries';

export {
  useCreateAdminRequest,
  useUpdateAdminRequest,
  useDeleteAdminRequest
} from './useOrganizationAdminMutations';
