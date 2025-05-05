
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProfileWithDetails } from "@/types";
import { getGeoNameLocationById } from "@/utils/geoNamesUtils";

export const useCommunityProfiles = (searchQuery: string = "") => {
  return useQuery({
    queryKey: ["community-profiles", searchQuery],
    queryFn: async () => {
      console.log("Fetching community profiles with search:", searchQuery);
      
      let query = supabase
        .from("profiles")
        .select('*');

      // Apply search filter if query exists
      if (searchQuery) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,headline.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query.order("first_name");

      if (error) {
        console.error("Error fetching profiles:", error);
        throw error;
      }

      console.log("Found profiles:", data.length);
      
      // Process each profile to add location and full_name
      const processedProfiles = await Promise.all(data.map(async (profile: ProfileWithDetails) => {
        // Format full name
        profile.full_name = [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ");

        // If location_id exists, fetch from GeoNames API
        if (profile.location_id) {
          try {
            const locationDetails = await getGeoNameLocationById(profile.location_id);
            if (locationDetails) {
              profile.location = locationDetails;
            }
          } catch (err) {
            console.error(`Error fetching location for profile ${profile.id}:`, err);
          }
        }

        return profile;
      }));

      return processedProfiles;
    },
    refetchOnWindowFocus: false,
  });
};
