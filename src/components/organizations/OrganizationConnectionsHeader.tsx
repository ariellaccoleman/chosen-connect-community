
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold font-heading">Your Organizations</h1>
        <div className="flex space-x-2">
          <Button 
            onClick={onConnectClick} 
            className="bg-chosen-blue hover:bg-chosen-navy"
            disabled={availableOrganizationsCount === 0}
          >
            <Link2 className="mr-2 h-4 w-4" />
            Connect to Org
          </Button>
          <Button 
            onClick={() => navigate("/organizations/new")} 
            className="bg-chosen-blue hover:bg-chosen-navy"
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
