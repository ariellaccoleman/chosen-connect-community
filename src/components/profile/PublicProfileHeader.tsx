
import { ProfileWithDetails } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatWebsiteUrl } from "@/utils/formatters";
import { Link, Twitter, Globe, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicProfileHeaderProps {
  profile: ProfileWithDetails;
}

const PublicProfileHeader = ({ profile }: PublicProfileHeaderProps) => {
  const getInitials = () => {
    return [profile.first_name?.[0], profile.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="h-24 w-24">
            {profile.avatar_url ? (
              <AvatarImage 
                src={profile.avatar_url} 
                alt={profile.full_name || "User"} 
                className="object-cover" 
              />
            ) : (
              <AvatarFallback className="bg-chosen-blue text-white text-3xl">
                {getInitials()}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        
        {/* Profile details */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
          
          {profile.headline && (
            <p className="text-gray-600 mt-1">{profile.headline}</p>
          )}
          
          {profile.location && (
            <p className="text-gray-500 mt-1">
              {profile.location.formatted_location}
            </p>
          )}
          
          {/* Social links */}
          <div className="flex flex-wrap gap-3 mt-4">
            {profile.linkedin_url && (
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={formatWebsiteUrl(profile.linkedin_url)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
            )}
            
            {profile.twitter_url && (
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={formatWebsiteUrl(profile.twitter_url)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </a>
              </Button>
            )}
            
            {profile.website_url && (
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={formatWebsiteUrl(profile.website_url)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Website
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Bio */}
      {profile.bio && (
        <div className="mt-6 prose max-w-none">
          <h2 className="text-lg font-semibold text-gray-900">About</h2>
          <p className="mt-2 text-gray-700">{profile.bio}</p>
        </div>
      )}
    </div>
  );
};

export default PublicProfileHeader;
