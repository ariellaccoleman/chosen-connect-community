
import { useState } from "react";
import { useAddOrganizationRelationship } from "@/hooks/organizations"; // Updated import
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

interface OrganizationConnectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  organizationId: string;
  organizationName: string;
}

const OrganizationConnectionDialog = ({
  isOpen,
  onOpenChange,
  userId,
  organizationId,
  organizationName,
}: OrganizationConnectionDialogProps) => {
  const [connectionType, setConnectionType] = useState<"current" | "former" | "connected_insider">("current");
  const addRelationship = useAddOrganizationRelationship();

  const handleConnectToOrg = async () => {
    if (!userId || !organizationId) return;
    
    try {
      await addRelationship.mutateAsync({
        profile_id: userId,
        organization_id: organizationId,
        connection_type: connectionType,
        department: null,
        notes: null
      });
      toast.success(`Connected to ${organizationName} as a ${
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
          <DialogTitle>Declare Inside Connection</DialogTitle>
          <DialogDescription>
            Select your relationship with {organizationName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
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
            disabled={addRelationship.isPending}
          >
            Confirm Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationConnectionDialog;
