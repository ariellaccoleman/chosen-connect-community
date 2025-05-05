
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LocationWithDetails } from "@/types";
import { ProfileFormValues } from "./ProfileForm";
import LocationSelector from "@/components/location/LocationSelector";

interface ProfileBasicInfoProps {
  form: UseFormReturn<ProfileFormValues>;
}

const ProfileBasicInfo = ({ form }: ProfileBasicInfoProps) => {
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
        
        {/* Location using our new GeoNames-based LocationSelector */}
        <FormField
          control={form.control}
          name="location_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Location</FormLabel>
              <FormControl>
                <LocationSelector 
                  value={field.value}
                  onChange={(locationId, location) => {
                    if (locationId && location) {
                      form.setValue("location_id", locationId);
                    }
                  }}
                  placeholder="Search for your location..."
                />
              </FormControl>
              <FormDescription>
                Search for cities worldwide using the GeoNames database
              </FormDescription>
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
