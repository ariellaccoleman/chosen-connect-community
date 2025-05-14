
import React from "react";
import { Control } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { CreateEventFormValues } from "./EventFormSchema";
import { logger } from "@/utils/logger";

interface EventPriceToggleProps {
  control: Control<CreateEventFormValues>;
}

const EventPriceToggle: React.FC<EventPriceToggleProps> = ({ control }) => {
  logger.info("Rendering EventPriceToggle component");
  
  return (
    <FormField
      control={control}
      name="is_paid"
      render={({ field }) => {
        logger.debug("EventPriceToggle field value:", field.value);
        return (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                Paid Event
              </FormLabel>
              <div className="text-sm text-gray-500">
                Toggle if this is a paid event requiring a fee
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value === true}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
};

export default EventPriceToggle;
