
import { useOrganizationAdminsByOrg } from "@/hooks/useOrganizationAdmins";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

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
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Organization Admins</CardTitle>
        </div>
        <CardDescription>People who manage this organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={admin.profile?.avatar_url || ""} alt={admin.profile?.full_name || ""} />
                <AvatarFallback>
                  {admin.profile?.first_name?.[0] || ""}
                  {admin.profile?.last_name?.[0] || ""}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{admin.profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{admin.profile?.headline || "Member"}</p>
              </div>
              <Badge variant="outline" className="capitalize">
                {admin.role || "Editor"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const AdminsSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-60 mt-1" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default OrganizationAdmins;
