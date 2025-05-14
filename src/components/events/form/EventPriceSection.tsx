
import React from "react";
import { Control } from "react-hook-form";
import { CreateEventFormValues } from "./EventFormSchema";
import EventPriceToggle from "./EventPriceToggle";
import FormInput from "@/components/common/form/FormInput";

interface EventPriceSectionProps {
  control: Control<CreateEventFormValues>;
  isPaid: boolean;
}

const EventPriceSection = ({ control, isPaid }: EventPriceSectionProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Pricing</h3>
      <EventPriceToggle control={control} />
      
      {isPaid && (
        <FormInput
          name="price"
          control={control}
          label="Price"
          type="number"
          placeholder="0.00"
          required={isPaid}
        />
      )}
    </div>
  );
};

export default EventPriceSection;
