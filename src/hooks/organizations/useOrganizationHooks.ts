import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createQueryHooks } from '@/hooks/core/factory/queryHookFactory';
import { organizationApi } from '@/api/organizations/organizationApiFactory';
import { OrganizationWithLocation, ProfileOrganizationRelationshipWithDetails } from '@/types';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/api/core/errorHandler';
import { organizationRelationshipsApi } from '@/api/organizations/relationshipsApi';
import { organizationCreateApi } from '@/api/organizations/organizationCreateApi';

// Create standard hooks using the factory
const organizationHooks = createQueryHooks<OrganizationWithLocation, string>(
  { 
    name: 'organization',
    pluralName: 'organizations',
    displayName: 'Organization',
    pluralDisplayName: 'Organizations'
  },
  organizationApi
);

// Export individual hooks from the factory
export const useOrganizationList = organizationHooks.useList;
export const useOrganizationById = organizationHooks.useById;
export const useOrganizationsByIds = organizationHooks.useByIds;
export const useCreateOrganization = organizationHooks.useCreate;
export const useUpdateOrganization = organizationHooks.useUpdate;
export const useDeleteOrganization = organizationHooks.useDelete;

// Add additional specialized hooks

/**
 * Hook for fetching multiple organizations
 */
export const useOrganizations = () => {
  return useQuery<ApiResponse<OrganizationWithLocation[]>, Error>({
    queryKey: ["organizations"],
    queryFn: () => organizationApi.getAll(),
  });
};

/**
 * Hook for fetching a single organization
 */
export const useOrganization = (id?: string) => {
  // Log details about the id that's being passed to this hook
  logger.info("useOrganization hook called with id:", { 
    id,
    idType: typeof id,
    idIsEmpty: id === '',
    idIsUndefined: id === undefined,
    idIsNull: id === null,
    idLength: id?.length
  });
  
  return useQuery<ApiResponse<OrganizationWithLocation | null>, Error>({
    queryKey: ["organization", id],
    queryFn: () => {
      if (!id) {
        logger.warn("useOrganization called without id");
        return Promise.resolve({ data: null, status: 'success', error: null });
      }
      
      // Log before the API call
      logger.info(`Making API call to get organization with ID: "${id}"`);
      
      return organizationApi.getById(id)
        .then(response => {
          // Log after the API call
          logger.info(`API response for organization "${id}":`, {
            success: !!response,
            hasData: !!response?.data,
            organizationName: response?.data?.name || "N/A"
          });
          return response;
        })
        .catch(error => {
          logger.error(`API error for organization "${id}":`, error);
          throw error;
        });
    },
    enabled: !!id,
    // Add retry configuration to handle intermittent issues
    retry: 2,
    // Use a stale time to reduce unnecessary refetches
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook for fetching organization relationships for a user
 */
export const useUserOrganizationRelationships = (profileId?: string) => {
  return useQuery<ApiResponse<ProfileOrganizationRelationshipWithDetails[]>, Error>({
    queryKey: ["organization-relationships", profileId],
    queryFn: () => {
      if (!profileId) {
        logger.warn("useUserOrganizationRelationships called without profileId");
        return Promise.resolve({ data: [], status: 'success', error: null });
      }
      return organizationRelationshipsApi.getUserOrganizationRelationships(profileId);
    },
    enabled: !!profileId
  });
};

/**
 * Hook for creating an organization with user relationship
 * This is a specialized version that handles both org creation and relationship setup
 */
export const useCreateOrganizationWithRelationships = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      name, 
      description, 
      website_url, 
      userId
    }: {
      name: string;
      description?: string;
      website_url?: string;
      userId: string;
    }) => {
      return organizationCreateApi.createOrganization(
        { name, description, website_url }, 
        userId
      );
    },
    onSuccess: (response) => {
      if (response.data) {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["organizations"] });
        toast.success("Organization created successfully!");
      }
      return response.data?.id;
    },
    onError: (error: Error) => {
      logger.error("Failed to create organization:", error);
      toast.error("Failed to create organization");
    }
  });
};
