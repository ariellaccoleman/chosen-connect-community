
import { useOrganizationAdminsByOrg, usePendingOrganizationAdmins, useOrganizationRole } from "@/hooks/organizations";
import { Card } from "@/components/ui/card";
import AdminsHeader from "./AdminsHeader";
import AdminsCardContent from "./AdminsCardContent";
import AdminsSkeleton from "./AdminsSkeleton";
import { useAuth } from "@/hooks/useAuth";

interface OrganizationAdminsProps {
  organizationId: string;
}

const OrganizationAdmins = ({ organizationId }: OrganizationAdminsProps) => {
  const { user } = useAuth();
  const { data: admins = [], isLoading } = useOrganizationAdminsByOrg(organizationId);
  const { data: userRole } = useOrganizationRole(user?.id, organizationId);
  const isOrgOwner = userRole === "owner";
  
  if (isLoading) {
    return <AdminsSkeleton />;
  }

  if (admins.length === 0 && !isOrgOwner) {
    return null;
  }

  return (
    <Card>
      <AdminsHeader />
      <AdminsCardContent 
        admins={admins}
        organizationId={organizationId}
        isOrgOwner={isOrgOwner}
      />
    </Card>
  );
};

export default OrganizationAdmins;
