
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProfileWithDetails, Location } from "@/types";
import { formatLocationWithDetails } from "@/utils/adminFormatters";

export const useCommunityProfiles = (filters: {
  search?: string;
  limit?: number;
  excludeId?: string;
  isApproved?: boolean;
}) => {
  return useQuery({
    queryKey: ["community-profiles", filters],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(
          `*,
          location:locations(*)`
        );
      
      // Always filter by is_approved unless explicitly set to false
      if (filters.isApproved !== false) {
        query = query.eq("is_approved", true);
      }

      if (filters.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,headline.ilike.%${filters.search}%`
        );
      }

      if (filters.excludeId) {
        query = query.neq("id", filters.excludeId);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching profiles:", error);
        throw error;
      }

      // Map to ProfileWithDetails format and add formatted fields
      return (data || []).map((profile) => {
        // Create the formatted profile with all required fields
        const profileWithDetails: ProfileWithDetails = {
          ...profile,
          full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          location: undefined // Initialize as undefined, will populate if exists
        };

        if (profile.location_id && profile.location) {
          profileWithDetails.location = formatLocationWithDetails(profile.location as unknown as Location);
        }

        return profileWithDetails;
      });
    },
  });
};
