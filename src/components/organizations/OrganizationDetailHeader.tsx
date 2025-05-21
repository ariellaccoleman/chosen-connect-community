
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import OrganizationActionButtons from "@/components/organizations/OrganizationActionButtons";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import { logger } from "@/utils/logger";

interface OrganizationDetailHeaderProps {
  userId: string | undefined;
  organizationId: string | undefined;
  organizationName: string;
  relationships: ProfileOrganizationRelationshipWithDetails[];
}

const OrganizationDetailHeader = ({
  userId,
  organizationId,
  organizationName,
  relationships,
}: OrganizationDetailHeaderProps) => {
  const navigate = useNavigate();
  
  // Update to use browser history instead of hardcoded route
  const handleBackClick = () => {
    logger.info("OrganizationDetailHeader - Navigating back in history");
    navigate(-1);
  };
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
      <Button variant="ghost" onClick={handleBackClick} className="mb-0">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      {userId && organizationId && (
        <OrganizationActionButtons
          userId={userId}
          organizationId={organizationId}
          organizationName={organizationName}
          relationships={relationships}
        />
      )}
    </div>
  );
};

export default OrganizationDetailHeader;
