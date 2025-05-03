
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile, useUpdateProfile, useLocations } from "@/hooks/useProfiles";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LocationWithDetails } from "@/types";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  headline: z.string().optional(),
  bio: z.string().optional(),
  linkedin_url: z.string().url("Must be a valid URL").optional().or(z.string().length(0)),
  twitter_url: z.string().url("Must be a valid URL").optional().or(z.string().length(0)),
  avatar_url: z.string().optional(),
  location_id: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile, isLoading: isLoadingProfile } = useCurrentProfile(user?.id);
  const updateProfile = useUpdateProfile();
  const [locationSearch, setLocationSearch] = useState("");
  const { data: locations = [], isLoading: isLoadingLocations } = useLocations(locationSearch);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      headline: "",
      bio: "",
      linkedin_url: "",
      twitter_url: "",
      avatar_url: "",
      location_id: "",
    },
  });

  // Populate form with profile data when available
  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        linkedin_url: profile.linkedin_url || "",
        twitter_url: profile.twitter_url || "",
        avatar_url: profile.avatar_url || "",
        location_id: profile.location_id || "",
      });
    }
  }, [profile, form]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user?.id) return;

    try {
      await updateProfile.mutateAsync({
        profileId: user.id,
        profileData: {
          ...data,
          // Clean empty strings to null for optional fields
          headline: data.headline || null,
          bio: data.bio || null,
          linkedin_url: data.linkedin_url || null,
          twitter_url: data.twitter_url || null,
          avatar_url: data.avatar_url || null,
          location_id: data.location_id || null,
        }
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading || isLoadingProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 font-heading">Edit Your Profile</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                              {field.value ? (
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
                            <CommandEmpty>No location found</CommandEmpty>
                            <CommandGroup className="max-h-60 overflow-auto">
                              {locations.map((location: LocationWithDetails) => (
                                <CommandItem
                                  key={location.id}
                                  value={location.formatted_location}
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
                                  {location.formatted_location}
                                </CommandItem>
                              ))}
                            </CommandGroup>
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
                
                {/* Social Media Links */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Social Media</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="linkedin_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="twitter_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://twitter.com/yourusername" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-chosen-blue hover:bg-chosen-navy"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
};

export default ProfileEdit;
