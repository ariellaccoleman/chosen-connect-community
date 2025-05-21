
import { ProfileWithDetails } from "@/types";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileInfo } from "./ProfileInfo";
import { ProfileBio } from "./ProfileBio";
import { ProfileSocialLinks } from "./ProfileSocialLinks";
import { Link } from "react-router-dom";
import TagList from "../tags/TagList";
import { APP_ROUTES } from "@/config/routes";
import { generatePath } from 'react-router-dom';

interface ProfileCardProps {
  profile: ProfileWithDetails;
}

const ProfileCard = ({ profile }: ProfileCardProps) => {
  // Generate the correct community profile URL using the APP_ROUTES constant
  const profileUrl = generatePath(APP_ROUTES.COMMUNITY_PROFILE, { id: profile.id });

  return (
    <Link to={profileUrl} className="block">
      <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row md:gap-6">
          {/* Left Column - Avatar and basic info */}
          <div className="flex items-start space-x-4 md:w-1/2">
            <ProfileAvatar profile={profile} />
            <ProfileInfo profile={profile} />
          </div>
          
          {/* Right Column - Tags (only on desktop) */}
          <div className="md:w-1/2 mt-4 md:mt-0">
            {profile.tags && profile.tags.length > 0 && (
              <div className="mb-2">
                <TagList 
                  tagAssignments={profile.tags} 
                  className="flex flex-wrap gap-2" 
                />
              </div>
            )}
          </div>
        </div>
        
        <ProfileBio profile={profile} />
        <ProfileSocialLinks profile={profile} />
      </div>
    </Link>
  );
};

export default ProfileCard;
