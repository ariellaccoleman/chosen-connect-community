
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProfileWithDetails, LocationWithDetails } from "@/types";
import { formatLocation } from "@/utils/formatters";

export const useCommunityProfiles = (filters: {
  search?: string;
  limit?: number;
  excludeId?: string;
}) => {
  return useQuery({
    queryKey: ["community-profiles", filters],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(
          `*,
          location:locations(*)`
        )
        .eq("is_approved", true);

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
        };

        if (profile.location_id && profile.location) {
          // Format the location data
          const locationWithDetails: LocationWithDetails = {
            ...profile.location,
            formatted_location: formatLocation(profile.location)
          };
          profileWithDetails.location = locationWithDetails;
        }

        return profileWithDetails;
      });
    },
  });
};
