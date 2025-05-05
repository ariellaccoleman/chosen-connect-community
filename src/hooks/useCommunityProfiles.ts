
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProfileWithDetails } from "@/types";

export const useCommunityProfiles = (searchQuery: string = "") => {
  return useQuery({
    queryKey: ["community-profiles", searchQuery],
    queryFn: async () => {
      console.log("Fetching community profiles with search:", searchQuery);
      
      let query = supabase
        .from("profiles")
        .select(`
          *,
          location:locations(*)
        `);

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

      // Ensure data is an array, even if it's null or undefined
      const profiles = data || [];
      
      console.log("Found profiles:", profiles.length);
      
      return profiles.map((profile: ProfileWithDetails) => {
        // Format full name
        profile.full_name = [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ");

        // Format location if available
        if (profile.location) {
          profile.location.formatted_location = [
            profile.location.city,
            profile.location.region,
            profile.location.country,
          ]
            .filter(Boolean)
            .join(", ");
        }

        return profile;
      });
    },
    refetchOnWindowFocus: false,
  });
};
