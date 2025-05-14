
import { ProfileWithDetails } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

interface ProfileInfoProps {
  profile: ProfileWithDetails;
}

export const ProfileInfo = ({ profile }: ProfileInfoProps) => {
  const isAdmin = profile.role === "admin";

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium text-gray-900 truncate">
          {profile.full_name || "Anonymous User"}
        </h3>
        {isAdmin && (
          <Badge variant="success" className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            <span>Admin</span>
          </Badge>
        )}
      </div>
      {profile.headline && (
        <p className="text-sm text-gray-600 truncate mb-1">
          {profile.headline}
        </p>
      )}
      {profile.location && (
        <p className="text-xs text-gray-500">
          {profile.location.formatted_location}
        </p>
      )}
    </div>
  );
};
