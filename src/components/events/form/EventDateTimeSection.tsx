
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EventDateTimeSectionProps {
  control: Control<CreateEventFormValues>;
}

const EventDateTimeSection = ({ control }: EventDateTimeSectionProps) => {
  // List of minute options in 15-minute increments
  const minuteOptions = [0, 15, 30, 45];
  
  // Create array of hour options 1-24
  const hourOptions = Array.from({ length: 24 }, (_, i) => i + 1);
  
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
      
      <div>
        <FormLabel>Duration</FormLabel>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-2">
            <FormField
              name="duration_hours"
              control={control}
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || "1"}
                  >
                    <FormControl>
                      <SelectTrigger className="w-16">
                        <SelectValue placeholder="Hours" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hourOptions.map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <span className="text-sm font-medium">hours</span>
          </div>
          
          <div className="flex items-center gap-2">
            <FormField
              name="duration_minutes"
              control={control}
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || "0"}
                  >
                    <FormControl>
                      <SelectTrigger className="w-16">
                        <SelectValue placeholder="Min" />
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
            <span className="text-sm font-medium">minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDateTimeSection;
