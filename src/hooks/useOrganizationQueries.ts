
import { useQuery } from "@tanstack/react-query";
import { organizationCrudApi } from "@/api/organizations/organizationsApi";
import { organizationRelationshipsApi } from "@/api/organizations/relationshipsApi";
import { useFilterTags } from "./useTagQueries";
import { logger } from "@/utils/logger";

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
  return useQuery({
    queryKey: ["organizations"],
    queryFn: organizationCrudApi.getAllOrganizations,
  });
};

export const useUserOrganizationRelationships = (profileId?: string) => {
  return useQuery({
    queryKey: ["organization-relationships", profileId],
    queryFn: () => {
      if (!profileId) {
        logger.warn("useUserOrganizationRelationships called without profileId");
        return Promise.resolve({ data: [] });
      }
      return organizationRelationshipsApi.getUserOrganizationRelationships(profileId);
    },
    enabled: !!profileId
  });
};

export const useOrganization = (id?: string) => {
  return useQuery({
    queryKey: ["organization", id],
    queryFn: () => {
      if (!id) {
        logger.warn("useOrganization called without id");
        return Promise.resolve({ data: null });
      }
      return organizationCrudApi.getOrganizationById(id);
    },
    enabled: !!id
  });
};
