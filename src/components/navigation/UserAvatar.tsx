
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile } from "@/integrations/supabase/types";

interface UserAvatarProps {
  profile?: Profile | null;
  size?: "sm" | "md" | "lg";
}

const UserAvatar = ({ profile, size = "md" }: UserAvatarProps) => {
  const getInitials = () => {
    if (!profile || !profile.first_name) return "U";
    
    return [profile.first_name?.[0], profile.last_name?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase();
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={profile?.avatar_url || ""} />
      <AvatarFallback className="bg-chosen-blue text-white">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
