
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
    
    // Create formatted_location if it doesn't exist
    if (typeof location === 'object') {
      // Format location components
      const city = location.city || '';
      const region = location.region || '';
      const country = location.country || '';
      
      // Create a formatted location string
      const formatted = [city, region, country]
        .filter(Boolean)
        .join(', ');
      
      // Add formatted_location to the location object
      (profile.location as any).formatted_location = formatted;
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
