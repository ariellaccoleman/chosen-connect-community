
import { ProfileWithDetails } from "@/types";

interface ProfileSocialLinksProps {
  profile: ProfileWithDetails;
}

export const ProfileSocialLinks = ({ profile }: ProfileSocialLinksProps) => {
  if (!profile.linkedinUrl && !profile.twitterUrl && !profile.websiteUrl) {
    return null;
  }
  
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {profile.linkedinUrl && (
        <a
          href={profile.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          LinkedIn
        </a>
      )}
      {profile.twitterUrl && (
        <a
          href={profile.twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          Twitter
        </a>
      )}
      {profile.websiteUrl && (
        <a
          href={profile.websiteUrl}
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
