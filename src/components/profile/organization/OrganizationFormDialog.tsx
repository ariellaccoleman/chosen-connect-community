
import { useState } from "react";
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
}

const OrganizationFormDialog = ({
  organizations,
  isLoadingOrgs,
  onClose,
  onSubmit
}: OrganizationFormDialogProps) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [connectionType, setConnectionType] = useState<"current" | "former" | "connected_insider">("current");
  const [department, setDepartment] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleSubmit = () => {
    // Only submit if an organization is selected
    if (selectedOrgId) {
      onSubmit({
        organizationId: selectedOrgId,
        connectionType,
        department: department || null,
        notes: notes || null
      });
      
      // Reset form fields
      setSelectedOrgId("");
      setConnectionType("current");
      setDepartment("");
      setNotes("");
      
      // Close the dialog after submission
      onClose();
    }
  };

  return (
    <div className="border rounded-md p-4 mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Add Organization Connection</h4>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div>
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
        
        <div>
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
        
        <div>
          <label className="text-sm font-medium">Department (Optional)</label>
          <Input 
            placeholder="E.g., Engineering, Marketing" 
            value={department} 
            onChange={(e) => setDepartment(e.target.value)} 
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Notes (Optional)</label>
          <Textarea 
            placeholder="Any additional details about your connection" 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
          />
        </div>
        
        <div className="flex justify-end pt-2">
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={!selectedOrgId}
          >
            Add Connection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationFormDialog;
