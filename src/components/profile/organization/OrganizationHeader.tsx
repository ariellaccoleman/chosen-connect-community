
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OrganizationHeaderProps {
  onAddOrgClick: () => void;
  isAddingNew: boolean;
  availableOrgsCount: number;
}

const OrganizationHeader = ({ 
  onAddOrgClick, 
  isAddingNew, 
  availableOrgsCount 
}: OrganizationHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-row items-center justify-between">
      <div>Organizations</div>
      <div className="flex space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={onAddOrgClick}
          disabled={isAddingNew || availableOrgsCount === 0}
        >
          <Plus className="h-4 w-4 mr-1" />
          Connect to Org
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate("/organizations/new")}
        >
          <Plus className="h-4 w-4 mr-1" />
          Create New Org
        </Button>
      </div>
    </div>
  );
};

export default OrganizationHeader;
