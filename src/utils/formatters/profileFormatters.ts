
import { Profile, ProfileWithDetails } from "@/types";
import { formatLocationWithDetails } from "./locationFormatters";

/**
 * Creates a full name from first and last name
 */
export const formatFullName = (firstName: string | null | undefined, lastName: string | null | undefined): string => {
  const first = firstName || '';
  const last = lastName || '';
  return [first, last].filter(Boolean).join(' ') || 'Anonymous User';
};

/**
 * Formats profile data with additional computed fields
 */
export const formatProfileWithDetails = (profileData: any): ProfileWithDetails => {
  if (!profileData) {
    // Return a minimal valid profile if no data
    return {
      id: '',
      email: '',
      first_name: '',
      last_name: '',
      avatar_url: null,
      headline: null,
      bio: null,
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
      location_id: null,
      full_name: 'Unknown User'
    };
  }

  // Extract base profile data
  const profile: ProfileWithDetails = {
    id: profileData.id,
    email: profileData.email,
    first_name: profileData.first_name || '',
    last_name: profileData.last_name || '',
    avatar_url: profileData.avatar_url,
    headline: profileData.headline,
    bio: profileData.bio,
    linkedin_url: profileData.linkedin_url,
    twitter_url: profileData.twitter_url,
    website_url: profileData.website_url,
    // Include role if it exists
    ...(profileData.role && { role: profileData.role }),
    location_id: profileData.location_id,
    company: profileData.company,
    created_at: profileData.created_at,
    updated_at: profileData.updated_at,
    is_approved: profileData.is_approved,
    membership_tier: profileData.membership_tier,
    // Add computed full name
    full_name: formatFullName(profileData.first_name, profileData.last_name)
  };

  // Add formatted location if it exists
  if (profileData.location) {
    profile.location = formatLocationWithDetails(profileData.location);
  }

  return profile;
};
