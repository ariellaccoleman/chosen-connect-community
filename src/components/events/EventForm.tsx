
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
import EventBasicDetails from "./form/EventBasicDetails";
import EventTypeSelector from "./form/EventTypeSelector";
import EventPriceToggle from "./form/EventPriceToggle";
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

  console.log("Rendering EventForm component", { isSubmitting, isPaid, isVirtual });
  logger.info("Rendering EventForm component", { isSubmitting, isPaid, isVirtual });

  const handleSubmit = async (values: CreateEventFormValues) => {
    console.log("EventForm handleSubmit called with values:", values);
    logger.info("EventForm handleSubmit called with values:", values);
    
    if (!user?.id) {
      console.error("No user ID found, cannot submit form");
      logger.error("Authentication error: No user ID found");
      toast("You must be logged in to create an event");
      return;
    }

    try {
      console.log("Processing form submission with user:", user.id);
      logger.info("Processing form submission...");
      // Calculate start and end timestamps
      const startDateTime = `${values.start_date}T${values.start_time}`;
      console.log("Start date time:", startDateTime);
      logger.info("Start date time:", startDateTime);
      
      // Calculate end time by adding duration to start time
      const startDate = new Date(startDateTime);
      const endDate = new Date(startDate.getTime());
      endDate.setHours(endDate.getHours() + values.duration_hours);
      endDate.setMinutes(endDate.getMinutes() + values.duration_minutes);
      
      console.log("Calculated dates:", { 
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString() 
      });
      logger.info("Calculated dates:", { 
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString() 
      });
      
      const start_time = formatDateForDb(startDate.toISOString());
      const end_time = formatDateForDb(endDate.toISOString());

      console.log("Formatted dates for DB:", { start_time, end_time });
      logger.info("Formatted dates for DB:", { start_time, end_time });

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
        start_time,
        end_time,
        is_virtual: values.is_virtual,
        location_id: values.is_virtual ? null : values.location_id,
        tag_id: values.tag_id || null,
        is_paid: values.is_paid,
        price: values.is_paid ? values.price : null,
      };

      console.log("About to submit event to API:", eventInput);
      logger.info("Submitting event to API:", eventInput);

      console.log("createEventMutation status:", {
        isPending: createEventMutation.isPending,
        isError: createEventMutation.isError,
        error: createEventMutation.error
      });

      const result = await createEventMutation.mutateAsync({
        event: eventInput,
        hostId: user.id,
      });

      console.log("Event creation successful with result:", result);
      logger.info("Event creation result:", result);

      toast("Event created successfully");

      if (onSuccess) {
        console.log("Calling onSuccess callback");
        onSuccess();
      } else {
        console.log("No onSuccess callback, navigating to /events");
        navigate("/events");
      }
    } catch (error) {
      console.error("Error creating event:", error);
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
      
      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-chosen-blue hover:bg-chosen-navy text-white px-4 py-2 rounded"
        >
          {isSubmitting ? "Creating..." : "Create Event"}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
