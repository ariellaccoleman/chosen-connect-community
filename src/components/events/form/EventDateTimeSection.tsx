
import React from "react";
import { Control } from "react-hook-form";
import FormInput from "@/components/common/form/FormInput";
import { CreateEventFormValues } from "./EventFormSchema";
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EventDateTimeSectionProps {
  control: Control<CreateEventFormValues>;
}

const EventDateTimeSection = ({ control }: EventDateTimeSectionProps) => {
  // List of minute options in 15-minute increments
  const minuteOptions = [0, 15, 30, 45];
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Date & Time</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          name="start_date"
          control={control}
          label="Start Date"
          type="date"
          required={true}
        />
        <FormInput
          name="start_time"
          control={control}
          label="Start Time"
          type="time"
          required={true}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="duration_hours"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hours</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={0}
                  max={24}
                  className="w-24"
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  value={field.value || 0}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          name="duration_minutes"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minutes</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || "0"}
              >
                <FormControl>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Minutes" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {minuteOptions.map((minute) => (
                    <SelectItem key={minute} value={minute.toString()}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default EventDateTimeSection;
