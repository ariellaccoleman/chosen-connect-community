
import { ProfileWithDetails } from "@/types";

interface ProfileInfoProps {
  profile: ProfileWithDetails;
}

export const ProfileInfo = ({ profile }: ProfileInfoProps) => {
  return (
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
  );
};
