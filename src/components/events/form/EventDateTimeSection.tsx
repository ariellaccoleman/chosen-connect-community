
import React from "react";
import { Control } from "react-hook-form";
import FormInput from "@/components/common/form/FormInput";
import { CreateEventFormValues } from "./EventFormSchema";

interface EventDateTimeSectionProps {
  control: Control<CreateEventFormValues>;
}

const EventDateTimeSection = ({ control }: EventDateTimeSectionProps) => {
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
        <FormInput
          name="duration_hours"
          control={control}
          label="Duration (Hours)"
          type="number"
          required={true}
        />
        <FormInput
          name="duration_minutes"
          control={control}
          label="Duration (Minutes)"
          type="number"
          required={true}
        />
      </div>
    </div>
  );
};

export default EventDateTimeSection;
