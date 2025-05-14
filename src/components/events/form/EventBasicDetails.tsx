
import React from "react";
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagSelector from "@/components/tags/TagSelector";
import { EntityType } from "@/types/entityTypes";
import { Tag } from "@/utils/tags";

interface EventBasicDetailsProps {
  control: Control<any>;
  onTypeChange?: (isVirtual: boolean) => void;
}

const EventBasicDetails = ({ control, onTypeChange }: EventBasicDetailsProps) => {
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
                  onTagSelected={(tag: Tag) => {
                    console.log("Tag selected:", tag);
                    field.onChange(tag.id);
                  }}
                  isAdmin={true}
                  currentSelectedTagId={field.value}
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
