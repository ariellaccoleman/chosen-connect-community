
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile } from "@/types";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserAvatarProps {
  profile?: Profile | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  isAdmin?: boolean;
}

const UserAvatar = ({ profile, size = "md", className = "", isAdmin = false }: UserAvatarProps) => {
  const getInitials = () => {
    if (!profile || !profile.first_name) return "U";
    
    return [profile.first_name?.[0], profile.last_name?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase();
  };

  // Removed debug console.log for UserAvatar

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
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

      {isAdmin && (
        <div className="absolute -bottom-1 -right-1">
          <Badge variant="success" className="h-5 w-5 p-0 flex items-center justify-center rounded-full">
            <ShieldCheck className="h-3 w-3" />
          </Badge>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
