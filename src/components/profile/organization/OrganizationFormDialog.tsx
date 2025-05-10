
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);

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

  // Find the selected organization name
  const selectedOrgName = organizations.find(org => org.id === selectedOrgId)?.name || "";

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
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  disabled={isLoadingOrgs || organizations.length === 0}
                >
                  {selectedOrgId ? selectedOrgName : "Select an organization..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search organizations..." 
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>
                      {isLoadingOrgs 
                        ? "Loading..." 
                        : "No organizations found."}
                    </CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {organizations.map((org) => (
                        <CommandItem
                          key={org.id}
                          value={org.name}
                          onSelect={() => {
                            setSelectedOrgId(org.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedOrgId === org.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {org.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
                <SelectItem value="current">Current Employee</SelectItem>
                <SelectItem value="former">Former Employee</SelectItem>
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
