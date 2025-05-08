
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileWithDetails } from "@/types";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ProfileAvatarProps {
  profile: ProfileWithDetails;
}

export const ProfileAvatar = ({ profile }: ProfileAvatarProps) => {
  const getInitials = () => {
    if (!profile || !profile.first_name) return "U";

    return [profile.first_name?.[0], profile.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="h-16 w-16">
      <AspectRatio ratio={1 / 1} className="bg-muted rounded-full overflow-hidden">
        <Avatar className="h-full w-full">
          <AvatarImage 
            src={profile.avatar_url || ""} 
            className="object-cover w-full h-full" 
          />
          <AvatarFallback className="bg-chosen-blue text-white text-xl">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </AspectRatio>
    </div>
  );
};
