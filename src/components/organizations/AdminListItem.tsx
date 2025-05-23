
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { OrganizationAdminWithDetails } from "@/types";

interface AdminListItemProps {
  admin: OrganizationAdminWithDetails;
}

const AdminListItem = ({ admin }: AdminListItemProps) => {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={admin.profile?.avatarUrl || ""} alt={admin.profile?.fullName || ""} />
        <AvatarFallback>
          {admin.profile?.firstName?.[0] || ""}
          {admin.profile?.lastName?.[0] || ""}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-medium">{admin.profile?.fullName}</p>
        <p className="text-xs text-muted-foreground">{admin.profile?.headline || "Member"}</p>
      </div>
      <Badge variant="outline" className="capitalize">
        {admin.role || "Editor"}
      </Badge>
    </div>
  );
};

export default AdminListItem;
