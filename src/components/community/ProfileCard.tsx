
import { ProfileWithDetails } from "@/types";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileInfo } from "./ProfileInfo";
import { ProfileBio } from "./ProfileBio";
import { ProfileSocialLinks } from "./ProfileSocialLinks";

interface ProfileCardProps {
  profile: ProfileWithDetails;
}

const ProfileCard = ({ profile }: ProfileCardProps) => {
  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <ProfileAvatar profile={profile} />
        <ProfileInfo profile={profile} />
      </div>
      
      <ProfileBio profile={profile} />
      <ProfileSocialLinks profile={profile} />
    </div>
  );
};

export default ProfileCard;
