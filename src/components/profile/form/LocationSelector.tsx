
import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
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
import { LocationWithDetails } from "@/types";
import { ProfileFormValues } from "../schema/profileSchema";

interface LocationSelectorProps {
  form: UseFormReturn<ProfileFormValues>;
}

const LocationSelector = ({ form }: LocationSelectorProps) => {
  const [locationSearch, setLocationSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithDetails | null>(null);
  
  const { data: locationsData = [], isLoading: isLoadingLocations } = useLocations(locationSearch);
  
  // Ensure locations is always a valid array
  const locations: LocationWithDetails[] = Array.isArray(locationsData) ? locationsData : [];

  // Effect to fetch the selected location when the component mounts
  useEffect(() => {
    const locationId = form.getValues("location_id");
    if (locationId && !selectedLocation) {
      // Find the location in the current locations array
      const location = locations.find(loc => loc.id === locationId);
      if (location) {
        setSelectedLocation(location);
      } else if (locationId) {
        // If the location isn't in the current results, fetch it specifically
        const fetchLocation = async () => {
          try {
            const { data: specificLocation } = await useLocations(undefined, locationId).refetch();
            if (specificLocation && specificLocation.length > 0) {
              setSelectedLocation(specificLocation[0]);
            }
          } catch (error) {
            console.error("Error fetching specific location:", error);
          }
        };
        fetchLocation();
      }
    }
  }, [form, locations, selectedLocation]);
  
  return (
    <FormField
      control={form.control}
      name="location_id"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Location</FormLabel>
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
                                  form.setValue("location_id", location.id);
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
