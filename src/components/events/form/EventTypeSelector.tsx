
import React from "react";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Control } from "react-hook-form";
import { CreateEventFormValues } from "./EventFormSchema";

interface EventTypeSelectorProps {
  control: Control<CreateEventFormValues>;
  onTypeChange: (isVirtual: boolean) => void;
}

const EventTypeSelector: React.FC<EventTypeSelectorProps> = ({
  control,
  onTypeChange
}) => {
  return (
    <FormField
      control={control}
      name="is_virtual"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>Event Type</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={(value) => {
                field.onChange(value === "virtual");
                onTypeChange(value === "virtual");
              }}
              defaultValue={field.value ? "virtual" : "in-person"}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="virtual" id="virtual" />
                <label htmlFor="virtual" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Virtual Event
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in-person" id="in-person" />
                <label htmlFor="in-person" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  In-Person Event
                </label>
              </div>
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default EventTypeSelector;
