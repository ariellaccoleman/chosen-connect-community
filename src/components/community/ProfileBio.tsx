
import { ProfileWithDetails } from "@/types";

interface ProfileBioProps {
  profile: ProfileWithDetails;
}

export const ProfileBio = ({ profile }: ProfileBioProps) => {
  if (!profile.bio) return null;
  
  return (
    <div className="mt-4">
      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{profile.bio}</p>
    </div>
  );
};
