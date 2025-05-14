
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, CreateEventFormValues } from "./form/EventFormSchema";
import { FormWrapper } from "@/components/common/form/FormWrapper";
import { useAuth } from "@/hooks/useAuth";
import { useEventMutations } from "@/hooks/useEventMutations";
import FormActions from "@/components/common/form/FormActions";
import LocationSelector from "@/components/profile/form/LocationSelector";
import { useNavigate } from "react-router-dom";
import FormInput from "@/components/common/form/FormInput";
import EventBasicDetails from "./form/EventBasicDetails";
import EventTypeSelector from "./form/EventTypeSelector";
import EventPriceToggle from "./form/EventPriceToggle";
import { CreateEventInput } from "@/types";

interface EventFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ onCancel, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createEventMutation } = useEventMutations();
  const [locationFieldVisible, setLocationFieldVisible] = useState(false);

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      start_time: "",
      end_time: "",
      is_virtual: true,
      location_id: null,
      tag_id: null,
      is_paid: false,
      price: null,
    },
  });

  const isVirtual = form.watch("is_virtual");
  const isPaid = form.watch("is_paid");
  const isSubmitting = createEventMutation.isPending;

  const handleSubmit = async (values: CreateEventFormValues) => {
    if (!user?.id) return;

    // Ensure required fields are provided
    if (!values.title || !values.start_time || !values.end_time) {
      return;
    }

    // If event is not paid, ensure price is null
    if (!values.is_paid) {
      values.price = null;
    }

    // If event is virtual, ensure location_id is null
    if (values.is_virtual) {
      values.location_id = null;
    }

    // Convert form values to CreateEventInput
    const eventInput: CreateEventInput = {
      title: values.title,
      description: values.description || "",
      start_time: values.start_time,
      end_time: values.end_time,
      is_virtual: values.is_virtual,
      location_id: values.location_id,
      tag_id: values.tag_id,
      is_paid: values.is_paid,
      price: values.price,
    };

    await createEventMutation.mutateAsync({
      event: eventInput,
      hostId: user.id,
    });

    if (onSuccess) {
      onSuccess();
    } else {
      navigate("/events");
    }
  };

  return (
    <FormWrapper form={form} onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold">Create New Event</h2>
      
      <EventBasicDetails control={form.control} />
      <EventTypeSelector 
        control={form.control} 
        onTypeChange={(isVirtual) => setLocationFieldVisible(!isVirtual)} 
      />
      
      {!isVirtual && (
        <LocationSelector
          control={form.control}
          label="Event Location"
          required={!isVirtual}
          fieldName="location_id"
        />
      )}
      
      <EventPriceToggle control={form.control} />
      
      {isPaid && (
        <FormInput
          name="price"
          control={form.control}
          label="Price"
          type="number"
          placeholder="0.00"
          required={isPaid}
        />
      )}
      
      <FormActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel="Create Event"
      />
    </FormWrapper>
  );
};

export default EventForm;
