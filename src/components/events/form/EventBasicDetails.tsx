
import React from "react";
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LocationSelector from "@/components/profile/form/LocationSelector";
import EventTypeSelector from "./EventTypeSelector";
import EventPriceToggle from "./EventPriceToggle";
import TagSelector from "@/components/tags/TagSelector";
import { EntityType } from "@/types/entityTypes";

interface EventBasicDetailsProps {
  control: Control<any>;
}

// Update EventTypeSelector interface to make onTypeChange optional
interface UpdatedEventTypeSelectorProps {
  control: Control<any>;
  onTypeChange?: (type: string) => void;
}

const EventBasicDetails = ({ control }: EventBasicDetailsProps) => {
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Title</FormLabel>
            <FormControl>
              <Input placeholder="Enter event title" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter event description"
                className="min-h-32"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <EventTypeSelector 
        control={control} 
      />

      <FormField
        control={control}
        name="location_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl>
              <LocationSelector
                control={control}
                label="Location"
                fieldName="location_id"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <EventPriceToggle control={control} />
      
      <FormField
        control={control}
        name="tag_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tag</FormLabel>
            <FormControl>
              <div className="mb-2">
                <TagSelector
                  targetType={EntityType.EVENT}
                  onTagSelected={(tag) => field.onChange(tag.id)}
                  isAdmin={true}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default EventBasicDetails;
