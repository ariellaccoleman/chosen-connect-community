
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OrganizationWithLocation } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import OrganizationSelector from "./OrganizationSelector";
import ConnectionTypeSelector from "./ConnectionTypeSelector";

interface OrganizationFormDialogProps {
  organizations: OrganizationWithLocation[];
  isLoadingOrgs: boolean;
  onClose: () => void;
  onSubmit: (data: {
    organizationId: string;
    connectionType: "current" | "former" | "connected_insider";
    department: string | null;
    notes: string | null;
  }) => void;
  isOpen?: boolean;
}

const OrganizationFormDialog = ({
  organizations,
  isLoadingOrgs,
  onClose,
  onSubmit,
  isOpen = false
}: OrganizationFormDialogProps) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [connectionType, setConnectionType] = useState<"current" | "former" | "connected_insider">("current");
  const [department, setDepartment] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Reset form when dialog is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedOrgId("");
      setConnectionType("current");
      setDepartment("");
      setNotes("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    // Only submit if an organization is selected
    if (selectedOrgId) {
      onSubmit({
        organizationId: selectedOrgId,
        connectionType,
        department: department || null,
        notes: notes || null
      });
      
      // Form reset handled by the useEffect
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Organization Connection</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <OrganizationSelector
            organizations={organizations}
            isLoadingOrgs={isLoadingOrgs}
            selectedOrgId={selectedOrgId}
            onSelectOrg={setSelectedOrgId}
          />
          
          <ConnectionTypeSelector
            value={connectionType}
            onChange={setConnectionType}
          />
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Department (Optional)</label>
            <Input 
              placeholder="E.g., Engineering, Marketing" 
              value={department} 
              onChange={(e) => setDepartment(e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea 
              placeholder="Any additional details about your connection" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={!selectedOrgId}
          >
            Add Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationFormDialog;
