
import { ShieldCheck } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface OrganizationAdminAlertProps {
  isAdmin: boolean;
  organizationId?: string;
}

const OrganizationAdminAlert = ({ isAdmin, organizationId }: OrganizationAdminAlertProps) => {
  if (!isAdmin) return null;
  
  return (
    <Alert className="mb-6 bg-blue-50 border-blue-200">
      <ShieldCheck className="h-4 w-4 text-blue-500" />
      <AlertTitle>Organization Admin</AlertTitle>
      <AlertDescription>
        You have admin access to this organization.
        {organizationId && (
          <Button 
            variant="link" 
            className="p-0 h-auto text-blue-600 pl-1"
            asChild
          >
            <Link to={`/organizations/${organizationId}/edit`}>
              Edit Organization Details
            </Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default OrganizationAdminAlert;
