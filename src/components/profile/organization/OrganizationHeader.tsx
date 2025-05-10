
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
      <div className="text-xl font-medium">Organizations</div>
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={onAddOrgClick} // Simplified direct call to the function
          disabled={isAddingNew || availableOrgsCount === 0}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          Connect to Org
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate("/organizations/new")}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          Create New Org
        </Button>
      </div>
    </div>
  );
};

export default OrganizationHeader;
