
import { ProfileWithDetails } from "@/types";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileInfo } from "./ProfileInfo";
import { ProfileBio } from "./ProfileBio";
import { ProfileSocialLinks } from "./ProfileSocialLinks";
import { Link } from "react-router-dom";
import TagList from "../tags/TagList";

interface ProfileCardProps {
  profile: ProfileWithDetails;
}

const ProfileCard = ({ profile }: ProfileCardProps) => {
  return (
    <Link to={`/directory/${profile.id}`} className="block">
      <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
          <ProfileAvatar profile={profile} />
          <ProfileInfo profile={profile} />
        </div>
        
        <ProfileBio profile={profile} />
        
        {profile.tags && profile.tags.length > 0 && (
          <div className="mt-3">
            <TagList 
              tagAssignments={profile.tags} 
              currentEntityType="person"
              hideEntityType={true}
            />
          </div>
        )}
        
        <ProfileSocialLinks profile={profile} />
      </div>
    </Link>
  );
};

export default ProfileCard;
