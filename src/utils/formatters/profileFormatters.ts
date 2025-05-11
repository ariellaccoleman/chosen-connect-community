
import { ProfileWithDetails } from "@/types/profile";
import { formatLocationWithDetails } from "./locationFormatters";

// Helper function to create a ProfileWithDetails from response data
export const formatProfileWithDetails = (profileData: any): ProfileWithDetails => {
  if (!profileData) {
    // Return a minimal valid ProfileWithDetails when no data is provided
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
      role: 'member',
      location_id: null,
      full_name: ''
    };
  }
  
  const formattedProfile: ProfileWithDetails = {
    id: profileData.id || '',
    email: profileData.email || '',
    first_name: profileData.first_name || '',
    last_name: profileData.last_name || '',
    avatar_url: profileData.avatar_url,
    headline: profileData.headline,
    bio: profileData.bio,
    linkedin_url: profileData.linkedin_url,
    twitter_url: profileData.twitter_url,
    website_url: profileData.website_url,
    role: (profileData.role as "admin" | "member") || 'member',
    location_id: profileData.location_id,
    company: profileData.company,
    created_at: profileData.created_at,
    updated_at: profileData.updated_at,
    is_approved: profileData.is_approved,
    membership_tier: profileData.membership_tier,
    full_name: [profileData.first_name, profileData.last_name]
      .filter(Boolean)
      .join(' ')
  };

  // Add location if it exists
  if (profileData.location) {
    formattedProfile.location = formatLocationWithDetails(profileData.location);
  }
  
  return formattedProfile;
};
