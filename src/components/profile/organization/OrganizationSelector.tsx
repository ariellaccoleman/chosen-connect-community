
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OrganizationWithLocation } from "@/types";
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

interface OrganizationSelectorProps {
  organizations: OrganizationWithLocation[];
  isLoadingOrgs: boolean;
  selectedOrgId: string;
  onSelectOrg: (orgId: string) => void;
}

const OrganizationSelector = ({
  organizations,
  isLoadingOrgs,
  selectedOrgId,
  onSelectOrg
}: OrganizationSelectorProps) => {
  const [open, setOpen] = useState(false);
  
  // Find the selected organization name
  const selectedOrgName = organizations.find(org => org.id === selectedOrgId)?.name || "";

  return (
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
                      onSelectOrg(org.id);
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
  );
};

export default OrganizationSelector;
