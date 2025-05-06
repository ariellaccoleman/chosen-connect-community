
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { 
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocations } from "@/hooks/useProfiles";
import { LocationWithDetails } from "@/types";
import { ProfileFormValues } from "./ProfileForm";

interface ProfileBasicInfoProps {
  form: UseFormReturn<ProfileFormValues>;
}

const ProfileBasicInfo = ({ form }: ProfileBasicInfoProps) => {
  const [locationSearch, setLocationSearch] = useState("");
  const { data: locationsData = [], isLoading: isLoadingLocations } = useLocations(locationSearch);
  
  // Ensure locations is always an array
  const locations = Array.isArray(locationsData) ? locationsData : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Update your personal information and how you appear in the community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar preview */}
        <div className="flex justify-center mb-4">
          <Avatar className="h-32 w-32">
            <AvatarImage src={form.watch("avatar_url") || ""} />
            <AvatarFallback className="bg-chosen-gold text-chosen-navy text-2xl">
              {form.watch("first_name")?.[0]}{form.watch("last_name")?.[0]}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Last Name */}
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Headline */}
        <FormField
          control={form.control}
          name="headline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Professional Headline</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Senior Developer at Company" {...field} />
              </FormControl>
              <FormDescription>
                A short description of your professional role
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Avatar URL */}
        <FormField
          control={form.control}
          name="avatar_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/avatar.jpg" {...field} />
              </FormControl>
              <FormDescription>
                URL to your profile image
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Location */}
        <FormField
          control={form.control}
          name="location_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Location</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value && locations.length > 0 ? (
                        locations.find((location) => location.id === field.value)?.formatted_location ||
                        "Select location..."
                      ) : (
                        "Select location..."
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[300px]">
                  <Command>
                    <CommandInput 
                      placeholder="Search locations..." 
                      onValueChange={setLocationSearch}
                    />
                    {isLoadingLocations ? (
                      <div className="py-6 text-center">Loading locations...</div>
                    ) : (
                      <>
                        <CommandEmpty>No location found</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-auto">
                          {locations.map((location: LocationWithDetails) => (
                            <CommandItem
                              key={location.id}
                              value={location.formatted_location || ""}
                              onSelect={() => {
                                form.setValue("location_id", location.id);
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
                              {location.formatted_location || "Unknown location"}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Bio */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell others about yourself..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description about you for your profile
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default ProfileBasicInfo;
