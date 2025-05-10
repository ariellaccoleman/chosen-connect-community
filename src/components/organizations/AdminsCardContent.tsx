
import { OrganizationAdminWithDetails } from "@/types";
import { CardContent } from "@/components/ui/card";
import AdminListItem from "./AdminListItem";

interface AdminsCardContentProps {
  admins: OrganizationAdminWithDetails[];
}

const AdminsCardContent = ({ admins }: AdminsCardContentProps) => {
  return (
    <CardContent>
      <div className="space-y-4">
        {admins.map((admin) => (
          <AdminListItem key={admin.id} admin={admin} />
        ))}
      </div>
    </CardContent>
  );
};

export default AdminsCardContent;
