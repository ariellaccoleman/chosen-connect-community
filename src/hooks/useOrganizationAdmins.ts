
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { useOrganizationAdmins } from '@/hooks/organizations';
 */

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
