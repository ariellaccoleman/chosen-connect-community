
import { useState } from "react";
import { useAddOrganizationRelationship } from "@/hooks/organizations";
import { toast } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { OrganizationWithLocation } from "@/types/organization";

interface OrganizationConnectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
  // Support both single organization ID or array of organizations
  organizations?: OrganizationWithLocation[];
  organizationId?: string;
  organizationName?: string;
  isLoading?: boolean;
}

const OrganizationConnectionDialog = ({
  isOpen,
  onOpenChange,
  userId,
  organizations = [],
  organizationId,
  organizationName,
  isLoading = false,
}: OrganizationConnectionDialogProps) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>(organizationId || "");
  const [connectionType, setConnectionType] = useState<"current" | "former" | "connected_insider">("current");
  const addRelationship = useAddOrganizationRelationship();

  // If we have a single organizationId/name passed, use those
  // Otherwise, look up the selected organization from the organizations array
  const selectedOrg = organizationId ? 
    { id: organizationId, name: organizationName || "Selected Organization" } : 
    organizations.find(org => org.id === selectedOrgId);

  const handleConnectToOrg = async () => {
    const orgId = organizationId || selectedOrgId;
    
    if (!userId || !orgId) {
      toast.error("Please select an organization");
      return;
    }
    
    try {
      await addRelationship.mutateAsync({
        profileId: userId,
        organizationId: orgId,
        connectionType: connectionType,
        department: null,
        notes: null
      });
      
      toast.success(`Connected to ${selectedOrg?.name || "organization"} as a ${
        connectionType === "current" ? "current employee" : 
        connectionType === "former" ? "former employee" : 
        "connected insider"
      }`);
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error connecting to organization:", error);
    }
  };

  // Determine if we should show the organization selector
  const showOrgSelector = !organizationId && organizations.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect to Organization</DialogTitle>
          <DialogDescription>
            {organizationId 
              ? `Declare your connection to ${organizationName || "this organization"}`
              : "Select an organization and your relationship to it"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading organizations...</p>
          ) : !showOrgSelector && !organizationId ? (
            <p className="text-muted-foreground">No available organizations to connect with</p>
          ) : (
            <>
              {showOrgSelector && (
                <div className="space-y-2">
                  <label htmlFor="organization" className="text-sm font-medium">
                    Organization
                  </label>
                  <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="connection-type" className="text-sm font-medium">
                  Connection Type
                </label>
                <Select value={connectionType} onValueChange={(value) => setConnectionType(value as "current" | "former" | "connected_insider")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select connection type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Employee</SelectItem>
                    <SelectItem value="former">Former Employee</SelectItem>
                    <SelectItem value="connected_insider">Connected Insider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnectToOrg}
            disabled={addRelationship.isPending || (!organizationId && !selectedOrgId)}
          >
            Confirm Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationConnectionDialog;
