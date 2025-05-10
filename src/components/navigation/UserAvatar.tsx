
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile } from "@/types";

interface UserAvatarProps {
  profile?: Profile | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const UserAvatar = ({ profile, size = "md", className = "" }: UserAvatarProps) => {
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
    <div className={`${sizeClasses[size]} ${className}`}>
      {profile?.avatar_url ? (
        <img 
          src={profile.avatar_url} 
          alt="User avatar"
          className="object-cover w-full h-full rounded-full" 
        />
      ) : (
        <Avatar className={`${sizeClasses[size]}`}>
          <AvatarFallback className="bg-chosen-blue text-white">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default UserAvatar;
