
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import OrganizationActionButtons from "@/components/organizations/OrganizationActionButtons";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import { APP_ROUTES } from "@/config/routes";
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
  
  // Add logging for debugging navigation
  const handleBackClick = () => {
    logger.info("OrganizationDetailHeader - Navigating back to organizations list");
    navigate(APP_ROUTES.ORGANIZATIONS);
  };
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
      <Button variant="ghost" onClick={handleBackClick} className="mb-0">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Organizations
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
