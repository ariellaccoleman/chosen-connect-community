
import { ProfileWithDetails, Location } from "@/types";
import { User } from "@supabase/supabase-js";

/**
 * Format a profile with additional details like full name and formatted location
 */
export function formatProfileWithDetails(data: any): ProfileWithDetails | null {
  if (!data) return null;
  
  const profile = data as ProfileWithDetails;
  
  // Format full name
  profile.full_name = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(' ');
  
  // Format location if available
  if (profile.location) {
    const location = profile.location as Location;
    if (!location.formatted_location) {
      location.formatted_location = [location.city, location.region, location.country]
        .filter(Boolean)
        .join(', ');
    }
  }
  
  return profile;
}

/**
 * Enhance a profile with user authentication data
 */
export function enhanceProfileWithAuthData(
  profile: ProfileWithDetails | null, 
  authUser?: User | null
): ProfileWithDetails | null {
  if (!profile) return null;
  
  const enhancedProfile = { ...profile };
  
  // Add role from auth user metadata if available
  if (authUser && authUser.user_metadata?.role) {
    enhancedProfile.role = authUser.user_metadata.role as "admin" | "member";
  }
  
  return enhancedProfile;
}
