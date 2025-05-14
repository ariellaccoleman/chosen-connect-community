
import React from "react";
import { FormField, FormItem, FormControl, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Control } from "react-hook-form";
import { CreateEventFormValues } from "./EventFormSchema";

interface EventPriceToggleProps {
  control: Control<CreateEventFormValues>;
}

const EventPriceToggle: React.FC<EventPriceToggleProps> = ({ control }) => {
  return (
    <FormField
      control={control}
      name="is_paid"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="space-y-0.5">
            <FormLabel>Paid Event</FormLabel>
            <p className="text-sm text-muted-foreground">
              Toggle this if your event requires payment
            </p>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default EventPriceToggle;
