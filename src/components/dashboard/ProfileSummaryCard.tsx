
import React from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, MapPin } from "lucide-react";
import { ProfileWithDetails } from "@/types";
import TagList from "../tags/TagList";

interface ProfileSummaryCardProps {
  profile: ProfileWithDetails;
}

const ProfileSummaryCard = ({ profile }: ProfileSummaryCardProps) => {
  const navigate = useNavigate();
  
  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U";
    
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile.avatar_url || ""} alt={fullName} />
              <AvatarFallback className="text-lg bg-chosen-blue text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="text-xl font-bold">{fullName}</h2>
              {profile.headline && (
                <p className="text-gray-600">{profile.headline}</p>
              )}
              {profile.location?.formatted_location && (
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span>{profile.location.formatted_location}</span>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="flex items-center" 
            onClick={() => navigate("/profile/edit")}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
        
        {profile.bio && (
          <div className="mt-4">
            <p className="text-gray-700">{profile.bio}</p>
          </div>
        )}
        
        {profile.tags && profile.tags.length > 0 && (
          <div className="mt-4">
            <TagList tagAssignments={profile.tags} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileSummaryCard;
