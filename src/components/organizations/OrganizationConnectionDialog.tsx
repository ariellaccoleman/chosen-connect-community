
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
  organizations: OrganizationWithLocation[];
  isLoading?: boolean;
}

const OrganizationConnectionDialog = ({
  isOpen,
  onOpenChange,
  userId,
  organizations,
  isLoading = false,
}: OrganizationConnectionDialogProps) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [connectionType, setConnectionType] = useState<"current" | "former" | "connected_insider">("current");
  const addRelationship = useAddOrganizationRelationship();

  const selectedOrg = organizations.find(org => org.id === selectedOrgId);

  const handleConnectToOrg = async () => {
    if (!userId || !selectedOrgId) {
      toast.error("Please select an organization");
      return;
    }
    
    try {
      await addRelationship.mutateAsync({
        profile_id: userId,
        organization_id: selectedOrgId,
        connection_type: connectionType,
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect to Organization</DialogTitle>
          <DialogDescription>
            Select an organization and your relationship to it
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading organizations...</p>
          ) : organizations.length === 0 ? (
            <p className="text-muted-foreground">No available organizations to connect with</p>
          ) : (
            <>
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
            disabled={addRelationship.isPending || !selectedOrgId}
          >
            Confirm Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationConnectionDialog;
