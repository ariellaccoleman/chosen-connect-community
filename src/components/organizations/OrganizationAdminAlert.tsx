
import { ShieldCheck } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

interface OrganizationAdminAlertProps {
  isAdmin: boolean;
  organizationId?: string;
}

const OrganizationAdminAlert = ({ isAdmin, organizationId }: OrganizationAdminAlertProps) => {
  const { isDarkMode } = useTheme();
  
  if (!isAdmin) return null;
  
  return (
    <Alert className={`mb-6 ${
      isDarkMode 
        ? 'bg-blue-900/30 border-blue-800 text-blue-100' 
        : 'bg-blue-50 border-blue-200 text-blue-800'
    }`}>
      <ShieldCheck className={`h-4 w-4 ${
        isDarkMode ? 'text-blue-300' : 'text-blue-500'
      }`} />
      <AlertTitle>Organization Admin</AlertTitle>
      <AlertDescription>
        You have admin access to this organization.
        {organizationId && (
          <Button 
            variant="link" 
            className={`p-0 h-auto pl-1 ${
              isDarkMode ? 'text-blue-300' : 'text-blue-600'
            }`}
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
