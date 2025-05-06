
import { useState } from "react";
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
import { ProfileFormValues } from "../ProfileForm";

interface LocationSelectorProps {
  form: UseFormReturn<ProfileFormValues>;
}

const LocationSelector = ({ form }: LocationSelectorProps) => {
  const [locationSearch, setLocationSearch] = useState("");
  const [open, setOpen] = useState(false);
  
  const { data: locationsData = [], isLoading: isLoadingLocations } = useLocations(locationSearch);
  
  // Ensure locations is always a valid array
  const locations: LocationWithDetails[] = Array.isArray(locationsData) ? locationsData : [];
  
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
                  {field.value && locations.length > 0
                    ? locations.find((location) => location.id === field.value)?.formatted_location || "Select location..."
                    : "Select location..."}
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
