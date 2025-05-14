
import { useQuery } from "@tanstack/react-query";
import { organizationCrudApi } from "@/api/organizations/organizationsApi";
import { organizationRelationshipsApi } from "@/api/organizations/relationshipsApi";
import { useFilterTags } from "./useTagQueries";
import { logger } from "@/utils/logger";
import { ApiResponse } from "@/api/core/errorHandler";
import { OrganizationWithLocation, ProfileOrganizationRelationshipWithDetails } from "@/types";

export function useOrganizationQueries() {
  const useOrganizations = () => {
    return useQuery({
      queryKey: ["organizations"],
      queryFn: organizationCrudApi.getAllOrganizations,
    });
  };

  return {
    useOrganizations,
    useFilterTags,
  };
}

export const useOrganizations = () => {
  return useQuery<ApiResponse<OrganizationWithLocation[]>, Error>({
    queryKey: ["organizations"],
    queryFn: organizationCrudApi.getAllOrganizations,
  });
};

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
      
      return organizationCrudApi.getOrganizationById(id)
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
    enabled: !!id
  });
};
