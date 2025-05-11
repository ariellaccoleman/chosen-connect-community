
import { formatUrl } from "../formUtils";

/**
 * Format website URL with proper protocol
 */
export const formatWebsiteUrl = (url: string | null | undefined): string | null => {
  return formatUrl(url);
};

/**
 * Format profile URLs (social media, website)
 */
export const formatProfileUrls = (profileData: {
  website_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
}) => {
  return {
    ...profileData,
    website_url: formatWebsiteUrl(profileData.website_url),
    linkedin_url: formatWebsiteUrl(profileData.linkedin_url),
    twitter_url: formatWebsiteUrl(profileData.twitter_url),
  };
};
