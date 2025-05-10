
import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

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
  organizations = [], // Default to empty array to prevent null/undefined
  isLoadingOrgs,
  onClose,
  onSubmit
}: OrganizationFormDialogProps) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedOrgName, setSelectedOrgName] = useState<string>("");
  const [connectionType, setConnectionType] = useState<"current" | "former" | "connected_insider">("current");
  const [department, setDepartment] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  // Set organization name when selectedOrgId changes
  useEffect(() => {
    if (selectedOrgId && Array.isArray(organizations)) {
      const selectedOrg = organizations.find(org => org.id === selectedOrgId);
      if (selectedOrg) {
        setSelectedOrgName(selectedOrg.name);
      }
    }
  }, [selectedOrgId, organizations]);

  const handleSubmit = () => {
    onSubmit({
      organizationId: selectedOrgId,
      connectionType,
      department: department || null,
      notes: notes || null
    });
    
    // Reset form fields
    setSelectedOrgId("");
    setSelectedOrgName("");
    setConnectionType("current");
    setDepartment("");
    setNotes("");
    
    // Make sure to close on desktop too
    if (!isMobile) {
      onClose();
    }
  };

  const renderOrgSelector = () => {
    // Ensure organizations is always an array
    const safeOrganizations = Array.isArray(organizations) ? organizations : [];
    
    return (
      <div>
        <label className="text-sm font-medium">Organization</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between text-left"
            >
              {selectedOrgName || "Select an organization"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search organizations..." />
              <CommandEmpty>
                {isLoadingOrgs ? "Loading..." : "No organization found"}
              </CommandEmpty>
              <CommandGroup className="max-h-60 overflow-auto">
                {safeOrganizations.map((org) => (
                  <CommandItem
                    key={org.id}
                    value={org.name}
                    onSelect={() => {
                      setSelectedOrgId(org.id);
                      setSelectedOrgName(org.name);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selectedOrgId === org.id ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {org.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  if (isMobile) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Organization Connection</DialogTitle>
            <DialogDescription>Connect your profile to an organization</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {renderOrgSelector()}
            
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
          </div>
          
          <DialogFooter className="flex justify-end pt-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={!selectedOrgId}
              className="bg-chosen-blue hover:bg-chosen-navy"
            >
              Add Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

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
        {renderOrgSelector()}
        
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
            className="bg-chosen-blue hover:bg-chosen-navy"
          >
            Add Connection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationFormDialog;
