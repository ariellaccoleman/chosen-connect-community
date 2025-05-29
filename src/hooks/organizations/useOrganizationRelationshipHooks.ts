
import { ProfileOrganizationRelationship, ConnectionType } from '@/types';
import { createOrganizationRelationshipApi } from '@/api/organizations/relationshipApiFactory';
import { createRelationshipHooks, createRelationshipMutationHook } from '@/hooks/core/factory/relationshipHooks';

/**
 * Organization Relationship API instance
 */
const organizationRelationshipApi = createOrganizationRelationshipApi();

/**
 * Core relationship hooks for organization relationships
 * Uses RelationshipApiOperations (no generic create method)
 */
const baseHooks = createRelationshipHooks(organizationRelationshipApi, {
  queryKey: 'organization-relationships',
  entityName: 'organization relationship',
  messages: {
    updateSuccess: 'Successfully updated organization connection',
    updateError: 'Failed to update organization connection. Please try again.',
    deleteSuccess: 'Successfully removed organization connection',
    deleteError: 'Failed to remove organization connection. Please try again.',
  },
  additionalInvalidateKeys: ['organizations', 'profiles']
});

/**
 * Relationship-specific creation hook for organization relationships
 */
export const useCreateOrganizationRelationship = createRelationshipMutationHook(
  ({ 
    profileId, 
    organizationId, 
    connectionType, 
    department, 
    notes 
  }: { 
    profileId: string; 
    organizationId: string; 
    connectionType: ConnectionType; 
    department?: string; 
    notes?: string; 
  }) =>
    organizationRelationshipApi.createRelationship(profileId, organizationId, connectionType, department, notes),
  {
    queryKey: 'organization-relationships',
    entityName: 'organization connection',
    successMessage: 'Successfully added organization connection',
    errorMessage: 'Failed to add organization connection. Please try again.',
    additionalInvalidateKeys: ['organizations', 'profiles']
  }
);

/**
 * Hook to get organization relationships for a profile
 */
export const useOrganizationRelationshipsForProfile = (profileId: string) => {
  return organizationRelationshipApi.getForProfile(profileId);
};

/**
 * Hook to get profile relationships for an organization
 */
export const useProfileRelationshipsForOrganization = (organizationId: string) => {
  return organizationRelationshipApi.getForOrganization(organizationId);
};

// Export core relationship hooks with descriptive names
export const {
  useGetAll: useGetAllOrganizationRelationships,
  useGetById: useGetOrganizationRelationshipById,
  useGetByIds: useGetOrganizationRelationshipsByIds,
  useUpdate: useUpdateOrganizationRelationship,
  useDelete: useDeleteOrganizationRelationship
} = baseHooks;

// For backward compatibility, alias the creation hook to the legacy name
export const useAddOrganizationRelationship = useCreateOrganizationRelationship;

// For backward compatibility, alias the existing hooks with legacy names
export const useUpdateOrganizationRelationshipLegacy = useUpdateOrganizationRelationship;
export const useDeleteOrganizationRelationshipLegacy = useDeleteOrganizationRelationship;
