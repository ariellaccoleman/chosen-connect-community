
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, CreateEventFormValues } from "./form/EventFormSchema";
import { useAuth } from "@/hooks/useAuth";
import { useEventMutations } from "@/hooks/useEventMutations";
import FormActions from "@/components/common/form/FormActions";
import LocationSelector from "@/components/profile/form/LocationSelector";
import { useNavigate } from "react-router-dom";
import FormInput from "@/components/common/form/FormInput";
import { EventBasicDetails, EventTypeSelector, EventPriceToggle } from "./form";
import { CreateEventInput } from "@/types";
import { formatDateForDb } from "@/utils/formatters";
import { logger } from "@/utils/logger";
import { toast } from "sonner";
import { useFormError } from "@/hooks/useFormError";

interface EventFormProps {
  onSuccess?: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createEventMutation } = useEventMutations();
  const [locationFieldVisible, setLocationFieldVisible] = useState(false);
  const { handleError } = useFormError();
  
  // Get today's date for default date
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];
  
  // Default time is 1:00 PM
  const defaultTime = "13:00";

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      start_date: defaultDate,
      start_time: defaultTime,
      duration_hours: 1,
      duration_minutes: 0,
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

  logger.info("Rendering EventForm component", { isSubmitting, isPaid, isVirtual });

  const handleSubmit = async (values: CreateEventFormValues) => {
    logger.info("EventForm handleSubmit called with values:", values);
    
    if (!user?.id) {
      logger.error("Authentication error: No user ID found");
      toast.error("You must be logged in to create an event");
      return;
    }

    try {
      logger.info("Processing form submission with user:", user.id);
      // Calculate start and end timestamps
      const startDateTime = `${values.start_date}T${values.start_time}`;
      logger.info("Start date time:", startDateTime);
      
      // Calculate end time by adding duration to start time
      const startDate = new Date(startDateTime);
      const endDate = new Date(startDate.getTime());
      endDate.setHours(endDate.getHours() + values.duration_hours);
      endDate.setMinutes(endDate.getMinutes() + values.duration_minutes);
      
      logger.info("Calculated dates:", { 
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString() 
      });
      
      const start_time = formatDateForDb(startDate.toISOString());
      const end_time = formatDateForDb(endDate.toISOString());

      logger.info("Formatted dates for DB:", { start_time, end_time });

      // If event is not paid, ensure price is null
      const finalPrice = values.is_paid ? values.price : null;

      // If event is virtual, ensure location_id is null
      const finalLocationId = values.is_virtual ? null : values.location_id;

      // Convert form values to CreateEventInput
      const eventInput: CreateEventInput = {
        title: values.title,
        description: values.description || "",
        start_time,
        end_time,
        is_virtual: values.is_virtual,
        location_id: finalLocationId,
        tag_id: values.tag_id || null,
        is_paid: values.is_paid,
        price: finalPrice,
      };

      logger.info("Submitting event to API:", eventInput);

      const result = await createEventMutation.mutateAsync({
        event: eventInput,
        hostId: user.id,
      });

      logger.info("Event creation result:", result);

      toast.success("Event created successfully");

      if (onSuccess) {
        logger.info("Calling onSuccess callback");
        onSuccess();
      } else {
        logger.info("No onSuccess callback, navigating to /events");
        navigate("/events");
      }
    } catch (error) {
      logger.error("Error creating event:", error);
      handleError(error);
    }
  };

  return (
    <form 
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
      id="event-form"
    >
      <h2 className="text-2xl font-bold">Create New Event</h2>
      
      <div className="space-y-6">
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
      </div>
      
      <FormActions
        isSubmitting={isSubmitting}
        submitLabel="Create Event"
      />
    </form>
  );
};

export default EventForm;
