
import { useQuery } from "@tanstack/react-query";
import { profilesApi } from "@/api";
import { ProfileWithDetails } from "@/types";
import { showErrorToast } from "@/api/core/errorHandler";

export const useCommunityProfiles = (filters: {
  search?: string;
  limit?: number;
  excludeId?: string;
  isApproved?: boolean;
  tagId?: string | null;
}) => {
  return useQuery({
    queryKey: ["community-profiles", filters],
    queryFn: async (): Promise<ProfileWithDetails[]> => {
      const response = await profilesApi.getCommunityProfiles(filters);
      
      if (response.error) {
        showErrorToast(response.error);
        return [];
      }
      
      return response.data || [];
    },
  });
};
