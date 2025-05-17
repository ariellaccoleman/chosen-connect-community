
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useCreateAdminRequest, useUserAdminRequests } from "@/hooks/useOrganizationAdmins";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck } from "lucide-react";
import { useUserOrganizationRelationships } from "@/hooks/useOrganizationQueries";

interface RequestAdminAccessButtonProps {
  organizationId: string;
  organizationName: string;
}

const RequestAdminAccessButton = ({
  organizationId,
  organizationName,
}: RequestAdminAccessButtonProps) => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const createRequest = useCreateAdminRequest();
  const { data: existingRequests = [] } = useUserAdminRequests(user?.id);
  
  // Fetch user's relationship with this organization
  const { data: relationshipsResponse } = useUserOrganizationRelationships(user?.id);
  const relationships = relationshipsResponse?.data || [];
  
  // Check if the user already has a relationship with this organization
  const hasRelationship = relationships.some(rel => rel.organization_id === organizationId);
  
  // Check if the user already has a request for this organization
  const existingRequest = existingRequests.find(
    (request) => request.organization_id === organizationId
  );

  const handleRequestAccess = async () => {
    if (!user?.id) return;
    
    await createRequest.mutateAsync({
      profile_id: user.id,
      organization_id: organizationId,
    } as any);
    
    setIsDialogOpen(false);
  };
  
  // Determine button state and text
  let buttonText = "Request Admin Access";
  let buttonDisabled = false;
  
  if (existingRequest) {
    if (existingRequest.is_approved) {
      buttonText = "Admin Access Granted";
      buttonDisabled = true;
    } else {
      buttonText = "Request Pending";
      buttonDisabled = true;
    }
  }

  // Don't render the button at all if the user has no relationship with this organization
  if (!hasRelationship) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsDialogOpen(true)}
        disabled={buttonDisabled || createRequest.isPending}
        className="flex gap-2 items-center"
      >
        <ShieldCheck className="h-4 w-4" />
        {buttonText}
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Admin Access</DialogTitle>
            <DialogDescription>
              Request permission to manage {organizationName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              As an admin, you will be able to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Edit organization profile details</li>
              <li>Manage organization information</li>
              <li>Update organization links and media</li>
            </ul>
            
            <Alert className="mt-6">
              <AlertDescription>
                Your request will be reviewed by site administrators.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestAccess}
              disabled={createRequest.isPending}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RequestAdminAccessButton;
