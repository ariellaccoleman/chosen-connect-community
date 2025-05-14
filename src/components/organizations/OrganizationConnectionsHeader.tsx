
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/config/routes";

interface OrganizationConnectionsHeaderProps {
  onConnectClick: () => void;
  availableOrganizationsCount: number;
}

const OrganizationConnectionsHeader = ({
  onConnectClick,
  availableOrganizationsCount
}: OrganizationConnectionsHeaderProps) => {
  const navigate = useNavigate();

  return (
    <>
      <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-3xl font-bold font-heading">Your Organizations</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            onClick={onConnectClick} 
            className="bg-chosen-blue hover:bg-chosen-navy flex-1 sm:flex-none"
            disabled={availableOrganizationsCount === 0}
          >
            <Link2 className="mr-2 h-4 w-4" />
            Connect to Org
          </Button>
          <Button 
            onClick={() => navigate(APP_ROUTES.CREATE_ORGANIZATION)} 
            className="bg-chosen-blue hover:bg-chosen-navy flex-1 sm:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Organization
          </Button>
        </div>
      </div>
    </>
  );
};

export default OrganizationConnectionsHeader;
