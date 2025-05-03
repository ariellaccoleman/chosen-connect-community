
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileWithDetails } from "@/types";

interface ProfileCardProps {
  profile: ProfileWithDetails;
}

const ProfileCard = ({ profile }: ProfileCardProps) => {
  const getInitials = () => {
    if (!profile || !profile.first_name) return "U";

    return [profile.first_name?.[0], profile.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url || ""} />
          <AvatarFallback className="bg-chosen-blue text-white text-xl">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {profile.full_name || "Anonymous User"}
          </h3>
          {profile.headline && (
            <p className="text-sm text-gray-600 truncate mb-1">
              {profile.headline}
            </p>
          )}
          {profile.location && (
            <p className="text-xs text-gray-500">
              {profile.location.formatted_location}
            </p>
          )}
        </div>
      </div>

      {profile.bio && (
        <p className="mt-4 text-sm text-gray-600 line-clamp-3">{profile.bio}</p>
      )}

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
    </div>
  );
};

export default ProfileCard;
