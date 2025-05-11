
import { Link as LinkIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit } from "lucide-react";
import { formatWebsiteUrl } from "@/utils/formatters/urlFormatters";
import { ProfileWithDetails } from "@/types";
import TagList from "@/components/tags/TagList";
import { useEntityTags } from "@/hooks/useTags";

interface ProfileSummaryCardProps {
  profile: ProfileWithDetails;
}

const ProfileSummaryCard = ({ profile }: ProfileSummaryCardProps) => {
  const navigate = useNavigate();
  const { data: tagAssignments = [], isLoading: isLoadingTags } = useEntityTags(
    profile.id,
    "person", // Changed from "profile" to "person" to match EntityTagManager
    { enabled: !!profile.id }
  );
  
  const getInitials = () => {
    return [profile.first_name?.[0], profile.last_name?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Profile</CardTitle>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => navigate("/profile")}
            className="text-chosen-blue hover:text-chosen-navy"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-4">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={profile.avatar_url || ""} />
            <AvatarFallback className="bg-chosen-gold text-chosen-navy text-lg">
              {getInitials() || "?"}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold">{profile.full_name}</h2>
          {profile.headline && (
            <p className="text-gray-600 text-center mt-1">{profile.headline}</p>
          )}
        </div>
        
        {/* Tags Section */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Skills & Tags</p>
          {isLoadingTags ? (
            <p className="text-sm italic">Loading tags...</p>
          ) : (
            <TagList tagAssignments={tagAssignments} className="mt-1" />
          )}
        </div>
        
        {profile.location && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">Location</p>
            <p>{profile.location.formatted_location}</p>
          </div>
        )}
        
        {profile.bio && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">Bio</p>
            <p className="text-sm">{profile.bio}</p>
          </div>
        )}
        
        <div className="flex flex-col space-y-2 mt-4">
          {profile.linkedin_url && (
            <a 
              href={formatWebsiteUrl(profile.linkedin_url)}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-sm text-chosen-blue hover:text-chosen-navy break-all"
            >
              <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              LinkedIn
            </a>
          )}
          {profile.twitter_url && (
            <a 
              href={formatWebsiteUrl(profile.twitter_url)}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-sm text-chosen-blue hover:text-chosen-navy break-all"
            >
              <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              Twitter
            </a>
          )}
          {profile.website_url && (
            <a 
              href={formatWebsiteUrl(profile.website_url)}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-sm text-chosen-blue hover:text-chosen-navy break-all"
            >
              <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              Website
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSummaryCard;
