
import React from "react";
import { Control } from "react-hook-form";
import FormInput from "@/components/common/form/FormInput";
import FormTextarea from "@/components/common/form/FormTextarea";
import { CreateEventFormValues } from "./EventFormSchema";

interface EventBasicDetailsProps {
  control: Control<CreateEventFormValues>;
}

const EventBasicDetails: React.FC<EventBasicDetailsProps> = ({ control }) => {
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
          name="start_time"
          control={control}
          label="Start Time"
          type="datetime-local"
          required
        />
        
        <FormInput
          name="end_time"
          control={control}
          label="End Time"
          type="datetime-local"
          required
        />
      </div>
    </>
  );
};

export default EventBasicDetails;
