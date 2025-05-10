
import { useOrganizationAdminsByOrg } from "@/hooks/useOrganizationAdmins";
import { Card } from "@/components/ui/card";
import AdminsHeader from "./AdminsHeader";
import AdminsCardContent from "./AdminsCardContent";
import AdminsSkeleton from "./AdminsSkeleton";

interface OrganizationAdminsProps {
  organizationId: string;
}

const OrganizationAdmins = ({ organizationId }: OrganizationAdminsProps) => {
  const { data: admins = [], isLoading } = useOrganizationAdminsByOrg(organizationId);

  if (isLoading) {
    return <AdminsSkeleton />;
  }

  if (admins.length === 0) {
    return null;
  }

  return (
    <Card>
      <AdminsHeader />
      <AdminsCardContent admins={admins} />
    </Card>
  );
};

export default OrganizationAdmins;
