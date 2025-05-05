
import { useState, useEffect } from "react";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGeoNamesLocations } from "@/hooks/useGeoNamesLocations";
import { LocationWithDetails } from "@/types";

interface LocationSelectorProps {
  value?: string;
  onChange: (value: string, location: LocationWithDetails) => void;
  placeholder?: string;
  className?: string;
}

const LocationSelector = ({ value, onChange, placeholder = "Select location...", className }: LocationSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationWithDetails | null>(null);
  
  const { data: locations = [], isLoading } = useGeoNamesLocations(searchTerm);

  // Find the selected location details when value changes
  useEffect(() => {
    if (value && !selectedLocation) {
      const found = locations.find(loc => loc.id === value);
      if (found) {
        setSelectedLocation(found);
      }
    }
  }, [value, locations, selectedLocation]);

  const handleSelect = (locationId: string) => {
    const selected = locations.find(loc => loc.id === locationId);
    if (selected) {
      setSelectedLocation(selected);
      onChange(selected.id, selected);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center">
            {selectedLocation ? (
              <>
                <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                <span className="truncate">{selectedLocation.formatted_location}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px] max-h-[300px]">
        <Command>
          <CommandInput 
            placeholder="Search locations..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          {isLoading && <div className="py-6 text-center text-sm text-muted-foreground">Loading locations...</div>}
          <CommandEmpty>
            {searchTerm.length > 0 ? 'No locations found' : 'Type to search for locations'}
          </CommandEmpty>
          <CommandGroup className="max-h-60 overflow-auto">
            {locations.map((location) => (
              <CommandItem
                key={location.id}
                value={location.formatted_location}
                onSelect={() => handleSelect(location.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    location.id === value ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{location.city}</span>
                  <span className="text-xs text-muted-foreground">
                    {[location.region, location.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default LocationSelector;
