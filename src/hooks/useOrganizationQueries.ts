import { useQuery } from "@tanstack/react-query";
import { organizationsApi } from "@/api";
import { useFilterTags } from "./useTagQueries";

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

export const useUserOrganizationRelationships = (profileId: string) => {
  return useQuery({
    queryKey: ["organization-relationships", profileId],
    queryFn: () => organizationsApi.getUserOrganizationRelationships(profileId),
    enabled: !!profileId
  });
};

export const useOrganization = (id: string) => {
  return useQuery({
    queryKey: ["organization", id],
    queryFn: () => organizationsApi.getOrganizationById(id),
    enabled: !!id
  });
};
