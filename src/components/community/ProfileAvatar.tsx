
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileWithDetails } from "@/types";

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
    <div className="flex-shrink-0 w-16 h-16 relative rounded-full overflow-hidden">
      {profile.avatar_url ? (
        <div className="h-full w-full flex items-center justify-center">
          <img 
            src={profile.avatar_url} 
            alt={`${profile.full_name || 'User'} avatar`}
            className="object-cover w-full h-full rounded-full"
          />
        </div>
      ) : (
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-chosen-blue text-white text-xl">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
