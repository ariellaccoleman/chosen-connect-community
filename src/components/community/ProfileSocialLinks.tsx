
import { ProfileWithDetails } from "@/types";

interface ProfileSocialLinksProps {
  profile: ProfileWithDetails;
}

export const ProfileSocialLinks = ({ profile }: ProfileSocialLinksProps) => {
  if (!profile.linkedin_url && !profile.twitter_url && !profile.website_url) {
    return null;
  }
  
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {profile.linkedin_url && (
        <a
          href={profile.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          LinkedIn
        </a>
      )}
      {profile.twitter_url && (
        <a
          href={profile.twitter_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          Twitter
        </a>
      )}
      {profile.website_url && (
        <a
          href={profile.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          Website
        </a>
      )}
    </div>
  );
};
