
import { ProfileWithDetails } from "@/types";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileInfo } from "./ProfileInfo";
import { ProfileBio } from "./ProfileBio";
import { ProfileSocialLinks } from "./ProfileSocialLinks";
import { Link } from "react-router-dom";
import TagList from "../tags/TagList";
import { APP_ROUTES } from "@/config/routes";
import { generatePath } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { useEffect } from "react";

interface ProfileCardProps {
  profile: ProfileWithDetails;
}

const ProfileCard = ({ profile }: ProfileCardProps) => {
  // Generate the correct profile URL using the APP_ROUTES constant and ID parameter 
  // The route is defined as /profile/:profileId in APP_ROUTES.PROFILE_VIEW
  const profileUrl = generatePath(APP_ROUTES.PROFILE_VIEW, { profileId: profile.id });
  
  // Debug profile tags - enhanced to show more details
  useEffect(() => {
    // Only log detailed information for the specific profile we're interested in
    if (profile.id === "95ad82bb-4109-4f88-8155-02231dda3b85") {
      logger.debug(`ProfileCard: Target profile - ${profile.first_name} ${profile.last_name} (${profile.id})`, {
        tags: profile.tags?.map(t => ({
          id: t.id,
          tag_id: t.tag_id,
          tag_name: t.tag ? t.tag.name : 'undefined'
        }))
      });
    }
  }, [profile]);

  // Check if profile has tags to determine layout
  const hasTags = profile.tags && profile.tags.length > 0;

  return (
    <Link to={profileUrl} className="block">
      <div className="bg-card text-card-foreground dark:bg-gray-800 dark:text-gray-50 shadow rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className={`flex ${hasTags ? 'flex-col md:flex-row md:gap-6' : 'flex-col'}`}>
          {/* Left Column - Avatar and basic info */}
          <div className={`flex items-start space-x-4 ${hasTags ? 'md:w-1/2' : 'w-full'}`}>
            <ProfileAvatar profile={profile} />
            <ProfileInfo profile={profile} />
          </div>
          
          {/* Right Column - Tags (only show if has tags) */}
          {hasTags && (
            <div className="md:w-1/2 mt-4 md:mt-0">
              <div className="mb-2">
                <TagList 
                  tagAssignments={profile.tags} 
                  className="flex flex-wrap gap-2" 
                  showDebugInfo={profile.id === "95ad82bb-4109-4f88-8155-02231dda3b85"}
                />
              </div>
            </div>
          )}
        </div>
        
        <ProfileBio profile={profile} />
        <ProfileSocialLinks profile={profile} />
      </div>
    </Link>
  );
};

export default ProfileCard;
