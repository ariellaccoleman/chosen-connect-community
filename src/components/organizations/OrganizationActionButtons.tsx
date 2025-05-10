
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import RequestAdminAccessButton from "@/components/organizations/RequestAdminAccessButton";
import OrganizationConnectionDialog from "@/components/organizations/OrganizationConnectionDialog";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";

interface OrganizationActionButtonsProps {
  userId: string | undefined;
  organizationId: string | undefined;
  organizationName: string;
  relationships: ProfileOrganizationRelationshipWithDetails[];
}

const OrganizationActionButtons = ({
  userId,
  organizationId,
  organizationName,
  relationships,
}: OrganizationActionButtonsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Check if user has a relationship with this organization
  const hasRelationship = relationships.some(rel => rel.organization_id === organizationId);
  
  if (!userId || !organizationId) return null;

  return (
    <>
      {hasRelationship ? (
        <RequestAdminAccessButton 
          organizationId={organizationId} 
          organizationName={organizationName} 
        />
      ) : (
        <Button 
          variant="outline" 
          onClick={() => setIsDialogOpen(true)}
          className="flex gap-2 items-center"
        >
          <Plus className="h-4 w-4" />
          Declare Inside Connection
        </Button>
      )}
      
      <OrganizationConnectionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userId={userId}
        organizationId={organizationId}
        organizationName={organizationName}
      />
    </>
  );
};

export default OrganizationActionButtons;
