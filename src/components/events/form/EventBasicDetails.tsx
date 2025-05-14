
import React from "react";
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import EntityTagManager from "@/components/tags/EntityTagManager";
import { EntityType } from "@/types/entityTypes";

interface EventBasicDetailsProps {
  control: Control<any>;
  onTypeChange?: (isVirtual: boolean) => void;
  eventId?: string; // Add eventId prop for existing events
  isEditing?: boolean;
}

const EventBasicDetails = ({ control, onTypeChange, eventId, isEditing = true }: EventBasicDetailsProps) => {
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

      <div>
        <FormLabel className="mb-2 block">Tags</FormLabel>
        <div className="mt-1">
          {eventId ? (
            <EntityTagManager
              entityId={eventId}
              entityType={EntityType.EVENT}
              isAdmin={true}
              isEditing={isEditing}
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              You can add tags after creating the event.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventBasicDetails;
