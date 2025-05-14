
import { useQuery } from "@tanstack/react-query";
import { organizationsApi } from "@/api";
import { useFilterTags } from "./useTagQueries";
import { logger } from "@/utils/logger";

export function useOrganizationQueries() {
  const useOrganizations = () => {
    return useQuery({
      queryKey: ["organizations"],
      queryFn: organizationsApi.getAllOrganizations,
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
    queryFn: organizationsApi.getAllOrganizations,
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
      return organizationsApi.getUserOrganizationRelationships(profileId);
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
      return organizationsApi.getOrganizationById(id);
    },
    enabled: !!id
  });
};
