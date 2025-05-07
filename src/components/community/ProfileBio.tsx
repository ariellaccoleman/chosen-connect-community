
import { ProfileWithDetails } from "@/types";

interface ProfileBioProps {
  profile: ProfileWithDetails;
}

export const ProfileBio = ({ profile }: ProfileBioProps) => {
  if (!profile.bio) return null;
  
  return (
    <p className="mt-4 text-sm text-gray-600 line-clamp-3">{profile.bio}</p>
  );
};
