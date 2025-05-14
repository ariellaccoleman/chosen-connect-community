
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileWithDetails } from "@/types";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileAvatarProps {
  profile: ProfileWithDetails;
  showAdminBadge?: boolean;
}

export const ProfileAvatar = ({ profile, showAdminBadge = false }: ProfileAvatarProps) => {
  const getInitials = () => {
    if (!profile || !profile.first_name) return "U";

    return [profile.first_name?.[0], profile.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase();
  };

  const isAdmin = profile.role === "admin" || showAdminBadge;

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
      
      {isAdmin && (
        <div className="absolute -bottom-1 -right-1">
          <Badge variant="success" className="h-6 w-6 p-0 flex items-center justify-center rounded-full">
            <ShieldCheck className="h-4 w-4" />
          </Badge>
        </div>
      )}
    </div>
  );
};
