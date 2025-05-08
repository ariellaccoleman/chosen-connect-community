
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
    <Avatar className="h-16 w-16">
      <AvatarImage src={profile.avatar_url || ""} />
      <AvatarFallback className="bg-chosen-blue text-white text-xl">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};
