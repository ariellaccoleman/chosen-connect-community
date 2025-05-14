
import React from "react";
import { Control } from "react-hook-form";
import FormInput from "@/components/common/form/FormInput";
import FormTextarea from "@/components/common/form/FormTextarea";
import { CreateEventFormValues } from "./EventFormSchema";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl,
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface EventBasicDetailsProps {
  control: Control<CreateEventFormValues>;
}

const EventBasicDetails: React.FC<EventBasicDetailsProps> = ({ control }) => {
  // Get today's date in YYYY-MM-DD format for default start date
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];
  
  // Set default time to 1:00 PM (13:00)
  const defaultTime = "13:00";

  return (
    <>
      <FormInput
        name="title"
        control={control}
        label="Event Title"
        placeholder="Enter event title"
        required
      />
      
      <FormTextarea
        name="description"
        control={control}
        label="Event Description"
        placeholder="Describe your event..."
        rows={5}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          name="start_date"
          control={control}
          label="Start Date"
          type="date"
          required
        />
        
        <FormInput
          name="start_time"
          control={control}
          label="Start Time"
          type="time"
          required
        />
      </div>
      
      <div className="space-y-2">
        <FormLabel>Duration</FormLabel>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="duration_hours"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      placeholder="Hours"
                      value={field.value || 0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <span className="ml-2 text-sm">hours</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      max={59}
                      placeholder="Minutes"
                      value={field.value || 0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <span className="ml-2 text-sm">minutes</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  );
};

export default EventBasicDetails;
