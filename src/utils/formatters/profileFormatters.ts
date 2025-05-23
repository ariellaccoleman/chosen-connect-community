
import { ProfileWithDetails, Location } from "@/types";
import { User } from "@supabase/supabase-js";

/**
 * Format a profile with additional details like full name and formatted location
 */
export function formatProfileWithDetails(data: any): ProfileWithDetails | null {
  if (!data) return null;
  
  // Convert snake_case to camelCase for client
  const profile: ProfileWithDetails = {
    id: data.id,
    entityType: data.entity_type || EntityType.PERSON,
    firstName: data.first_name || '',
    lastName: data.last_name || '',
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim(), // For Entity interface
    email: data.email || '',
    bio: data.bio || '',
    headline: data.headline || '',
    avatarUrl: data.avatar_url || '',
    company: data.company || '',
    websiteUrl: data.website_url || '',
    twitterUrl: data.twitter_url || '',
    linkedinUrl: data.linkedin_url || '',
    timezone: data.timezone || 'UTC',
    isApproved: data.is_approved !== false, // Default to true if not specified
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
    location: data.location ? {
      id: data.location.id,
      city: data.location.city || '',
      region: data.location.region || '',
      country: data.location.country || '',
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    } : undefined,
  };
  
  // Format full name
  profile.fullName = [profile.firstName, profile.lastName]
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
      profile.formattedLocation = [city, region, country]
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

// Import needed for the EntityType enum
import { EntityType } from '@/types/entityTypes';
