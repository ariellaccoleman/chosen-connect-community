
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { OrganizationWithLocation } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

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
  isOpen?: boolean; // Add isOpen prop
}

const OrganizationFormDialog = ({
  organizations,
  isLoadingOrgs,
  onClose,
  onSubmit,
  isOpen = false // Default to false
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization</label>
            <Select 
              value={selectedOrgId} 
              onValueChange={setSelectedOrgId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingOrgs ? (
                  <div className="p-2">Loading...</div>
                ) : organizations.length === 0 ? (
                  <div className="p-2">No organizations available</div>
                ) : (
                  organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Connection Type</label>
            <Select 
              value={connectionType} 
              onValueChange={(value: "current" | "former" | "connected_insider") => setConnectionType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select connection type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Member</SelectItem>
                <SelectItem value="former">Former Member</SelectItem>
                <SelectItem value="connected_insider">Connected Insider</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
