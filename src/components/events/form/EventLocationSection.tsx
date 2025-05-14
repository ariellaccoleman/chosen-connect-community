
import React from "react";
import { Control } from "react-hook-form";
import { CreateEventFormValues } from "./EventFormSchema";
import EventTypeSelector from "./EventTypeSelector";
import LocationSelector from "@/components/profile/form/LocationSelector";

interface EventLocationSectionProps {
  control: Control<CreateEventFormValues>;
  isVirtual: boolean;
  onLocationTypeChange: (isVirtual: boolean) => void;
}

const EventLocationSection = ({ 
  control, 
  isVirtual,
  onLocationTypeChange
}: EventLocationSectionProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Location</h3>
      <EventTypeSelector 
        control={control} 
        onTypeChange={onLocationTypeChange}
      />
      
      {!isVirtual && (
        <LocationSelector
          control={control}
          label="Event Location"
          required={!isVirtual}
          fieldName="location_id"
        />
      )}
    </div>
  );
};

export default EventLocationSection;
