
import { useState, useEffect } from "react";
import { Control, UseFormReturn } from "react-hook-form";
import { 
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocations } from "@/hooks/useLocations";
import { useLocationById } from "@/hooks/useLocationById";
import { LocationWithDetails } from "@/types";

interface LocationSelectorProps {
  control: Control<any>;
  label: string;
  required?: boolean;
  fieldName?: string;
  form?: UseFormReturn<any>;
}

const LocationSelector = ({ control, label, required = false, fieldName = "location_id", form }: LocationSelectorProps) => {
  const [locationSearch, setLocationSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithDetails | null>(null);
  
  // Get the current value from the form if available
  const currentLocationId = form?.getValues(fieldName) || control._getWatch?.(fieldName);
  
  // Get locations for dropdown - pass the search term directly
  // This is now safe since we're handling commas specially in the API
  const { data: locationsData = [], isLoading: isLoadingLocations } = useLocations(locationSearch);
  
  // Get specific location by ID if we have an ID but not the location object
  const { data: locationById } = useLocationById(
    currentLocationId && !selectedLocation ? currentLocationId : undefined
  );
  
  // Ensure locations is always a valid array
  const locations: LocationWithDetails[] = Array.isArray(locationsData) ? locationsData : [];
  
  // Update selected location when locationById changes
  useEffect(() => {
    if (locationById && !selectedLocation) {
      setSelectedLocation(locationById);
    }
  }, [locationById, selectedLocation]);
  
  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  type="button"
                  className={cn(
                    "justify-between",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value && (selectedLocation ? selectedLocation.formatted_location : 
                    locations.find((location) => location.id === field.value)?.formatted_location) || 
                    "Select location..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[300px] bg-white" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search locations..." 
                  onValueChange={(value) => {
                    setLocationSearch(value);
                  }}
                />
                <CommandList>
                  {isLoadingLocations ? (
                    <div className="py-6 text-center">Loading locations...</div>
                  ) : (
                    <>
                      {locations.length === 0 ? (
                        <CommandEmpty>No locations found</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {locations.map((location) => {
                            // Ensure we have a valid string for the CommandItem value
                            const displayValue = location.formatted_location || 
                              [location.city, location.region, location.country]
                                .filter(Boolean)
                                .join(", ") || 
                              "Unknown location";
                              
                            return (
                              <CommandItem
                                key={location.id}
                                value={displayValue}
                                onSelect={() => {
                                  // Use the appropriate form API to set the value
                                  if (form) {
                                    form.setValue(fieldName, location.id);
                                  } else {
                                    field.onChange(location.id);
                                  }
                                  setSelectedLocation(location);
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    location.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {displayValue}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default LocationSelector;
