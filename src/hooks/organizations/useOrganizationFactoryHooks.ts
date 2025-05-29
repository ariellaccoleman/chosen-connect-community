
import { createQueryHooks } from '@/hooks/core/factory/queryHookFactory';
import { createRelationshipHooks, createRelationshipMutationHook } from '@/hooks/core/factory/relationshipHooks';
import { organizationApi } from '@/api/organizations/organizationApiFactory';
import { createOrganizationRelationshipApi } from '@/api/organizations/relationshipApiFactory';
import { OrganizationWithLocation, ProfileOrganizationRelationshipWithDetails } from '@/types';
import { ConnectionType } from '@/types';

/**
 * Factory-based organization hooks that don't instantiate repositories at import time
 */

// Create organization hooks (lazy instantiation)
const createOrgHooks = () => {
  return createQueryHooks<OrganizationWithLocation, string>(
    { 
      name: 'organization',
      pluralName: 'organizations',
      displayName: 'Organization',
      pluralDisplayName: 'Organizations'
    },
    organizationApi
  );
};

// Create organization relationship hooks (lazy instantiation)
const createOrgRelationshipHooks = () => {
  const orgRelationshipApi = createOrganizationRelationshipApi();
  return createRelationshipHooks(orgRelationshipApi, {
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
};

/**
 * Hook for fetching multiple organizations (factory-based)
 */
export const useOrganizations = () => {
  const orgHooks = createOrgHooks();
  return orgHooks.useList();
};

/**
 * Hook for fetching a single organization (factory-based)
 */
export const useOrganization = (id?: string) => {
  const orgHooks = createOrgHooks();
  return orgHooks.useById(id);
};

/**
 * Organization CRUD hooks (factory-based)
 */
export const useOrganizationList = () => {
  const orgHooks = createOrgHooks();
  return orgHooks.useList();
};

export const useOrganizationById = (id?: string) => {
  const orgHooks = createOrgHooks();
  return orgHooks.useById(id);
};

export const useOrganizationsByIds = (ids: string[]) => {
  const orgHooks = createOrgHooks();
  return orgHooks.useByIds(ids);
};

export const useCreateOrganization = () => {
  const orgHooks = createOrgHooks();
  return orgHooks.useCreate();
};

export const useUpdateOrganization = () => {
  const orgHooks = createOrgHooks();
  return orgHooks.useUpdate();
};

export const useDeleteOrganization = () => {
  const orgHooks = createOrgHooks();
  return orgHooks.useDelete();
};

/**
 * Organization relationship hooks (factory-based)
 */
export const useCreateOrganizationRelationship = createRelationshipMutationHook(
  ({ profileId, organizationId, connectionType, department, notes }: { 
    profileId: string; 
    organizationId: string; 
    connectionType: ConnectionType; 
    department?: string; 
    notes?: string; 
  }) => {
    const orgRelationshipApi = createOrganizationRelationshipApi();
    return orgRelationshipApi.createRelationship(profileId, organizationId, connectionType, department, notes);
  },
  {
    queryKey: 'organization-relationships',
    entityName: 'organization connection',
    successMessage: 'Successfully added organization connection',
    errorMessage: 'Failed to add organization connection. Please try again.',
    additionalInvalidateKeys: ['organizations', 'profiles']
  }
);

export const useUpdateOrganizationRelationship = () => {
  const orgRelationshipHooks = createOrgRelationshipHooks();
  return orgRelationshipHooks.useUpdate();
};

export const useDeleteOrganizationRelationship = () => {
  const orgRelationshipHooks = createOrgRelationshipHooks();
  return orgRelationshipHooks.useDelete();
};

/**
 * Hook for fetching organization relationships for a user (factory-based)
 */
export const useUserOrganizationRelationships = (profileId?: string) => {
  const orgRelationshipApi = createOrganizationRelationshipApi();
  return orgRelationshipApi.getForProfile(profileId || '');
};

// Backward compatibility aliases
export const useAddOrganizationRelationship = useCreateOrganizationRelationship;
