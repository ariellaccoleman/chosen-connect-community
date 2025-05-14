
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, CreateEventFormValues } from "./EventFormSchema";
import { logger } from "@/utils/logger";
import { FormWrapper } from "@/components/common/form";
import FormActions from "@/components/common/form/FormActions";
import { EventBasicDetails } from "./index";
import EventDateTimeSection from "./EventDateTimeSection";
import EventLocationSection from "./EventLocationSection";
import EventPriceSection from "./EventPriceSection";
import { CreateEventInput, EventWithDetails } from "@/types";
import { format } from "date-fns";

interface CreateEventFormProps {
  onSubmit: (eventInput: CreateEventInput) => Promise<void>;
  isSubmitting: boolean;
  onLocationTypeChange: (isVirtual: boolean) => void;
  eventData?: EventWithDetails;
}

const CreateEventForm = ({
  onSubmit,
  isSubmitting,
  onLocationTypeChange,
  eventData
}: CreateEventFormProps) => {
  // Get today's date for default date
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];
  
  // Default time is 1:00 PM
  const defaultTime = "13:00";

  // Initialize form with event data if available
  const initFormData = () => {
    if (!eventData) {
      return {
        title: "",
        description: "",
        start_date: defaultDate,
        start_time: defaultTime,
        duration_hours: 1,
        duration_minutes: 0,
        is_virtual: true,
        location_id: null,
        is_paid: false,
        price: null,
      };
    }

    // Parse existing event data for edit mode
    const startDate = new Date(eventData.start_time);
    const endDate = new Date(eventData.end_time);
    
    // Calculate duration
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      title: eventData.title || "",
      description: eventData.description || "",
      start_date: format(startDate, 'yyyy-MM-dd'),
      start_time: format(startDate, 'HH:mm'),
      duration_hours: durationHours,
      duration_minutes: durationMinutes,
      is_virtual: eventData.is_virtual,
      location_id: eventData.location_id,
      is_paid: eventData.is_paid,
      price: eventData.price ? Number(eventData.price) : null,
    };
  };

  logger.info("CreateEventForm render with data", { 
    isEditing: !!eventData, 
    eventId: eventData?.id,
    defaultValues: initFormData()
  });

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: initFormData()
  });

  const isVirtual = form.watch("is_virtual");
  const isPaid = form.watch("is_paid");

  const handleFormSubmit = async (values: CreateEventFormValues) => {
    logger.info("CreateEventForm handleFormSubmit called with values:", values);
    
    // Calculate start and end timestamps
    const startDateTime = `${values.start_date}T${values.start_time}`;
    logger.info("Start date time:", startDateTime);
    
    // Calculate end time by adding duration to start time
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime());
    endDate.setHours(endDate.getHours() + (values.duration_hours || 0));
    endDate.setMinutes(endDate.getMinutes() + (values.duration_minutes || 0));
    
    logger.info("Calculated dates:", { 
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString() 
    });

    // If event is not paid, ensure price is null
    const finalPrice = values.is_paid ? values.price : null;

    // If event is virtual, ensure location_id is null
    const finalLocationId = values.is_virtual ? null : values.location_id;

    // Convert form values to CreateEventInput
    const eventInput: CreateEventInput = {
      title: values.title,
      description: values.description || "",
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      is_virtual: values.is_virtual,
      location_id: finalLocationId,
      is_paid: values.is_paid,
      price: finalPrice,
    };

    logger.info("Submitting event to API:", eventInput);
    
    await onSubmit(eventInput);
  };

  return (
    <FormWrapper
      form={form}
      onSubmit={handleFormSubmit}
      className="space-y-8"
      id="event-form"
    >
      {/* Basic Details */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Event Details</h3>
        <EventBasicDetails 
          control={form.control} 
          onTypeChange={onLocationTypeChange} 
          eventId={eventData?.id}
          isEditing={!!eventData?.id}
        />
      </div>
      
      {/* Date and Time Section */}
      <EventDateTimeSection control={form.control} />
      
      {/* Location Section */}
      <EventLocationSection 
        control={form.control} 
        isVirtual={isVirtual}
        onLocationTypeChange={onLocationTypeChange}
      />
      
      {/* Price Section */}
      <EventPriceSection 
        control={form.control}
        isPaid={isPaid}
      />
      
      <FormActions
        isSubmitting={isSubmitting}
        submitLabel={eventData ? "Update Event" : "Create Event"}
        formId="event-form"
      />
    </FormWrapper>
  );
};

export default CreateEventForm;
