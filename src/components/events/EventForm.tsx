
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, CreateEventFormValues } from "./form/EventFormSchema";
import { useAuth } from "@/hooks/useAuth";
import { useEventMutations } from "@/hooks/useEventMutations";
import FormActions from "@/components/common/form/FormActions";
import { useNavigate } from "react-router-dom";
import FormInput from "@/components/common/form/FormInput";
import { EventBasicDetails } from "./form";
import { CreateEventInput } from "@/types";
import { formatDateForDb } from "@/utils/formatters";
import { logger } from "@/utils/logger";
import { useFormError } from "@/hooks/useFormError";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { FormWrapper } from "@/components/common/form";
import EventTypeSelector from "./form/EventTypeSelector";
import EventPriceToggle from "./form/EventPriceToggle";
import LocationSelector from "@/components/profile/form/LocationSelector";
import { toast } from "sonner";

interface EventFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const EventForm: React.FC<EventFormProps> = ({ onSuccess, onError }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createEventMutation } = useEventMutations();
  const [locationFieldVisible, setLocationFieldVisible] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const { handleError } = useFormError();
  
  // Get today's date for default date
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];
  
  // Default time is 1:00 PM
  const defaultTime = "13:00";

  logger.info("EventForm initial render with defaults", { defaultDate, defaultTime });

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
      is_paid: false,
      price: null,
    },
  });

  const isVirtual = form.watch("is_virtual");
  const isPaid = form.watch("is_paid");
  const isSubmitting = createEventMutation.isPending;

  logger.info("EventForm component state", { 
    isSubmitting, 
    isPaid, 
    isVirtual,
    createdEventId
  });

  const handleFormSubmit = async (values: CreateEventFormValues) => {
    logger.info("EventForm handleFormSubmit called with values:", values);
    
    if (!user?.id) {
      const error = new Error("Authentication error: No user ID found");
      logger.error(error.message);
      if (onError) onError(error);
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
      endDate.setHours(endDate.getHours() + (values.duration_hours || 0));
      endDate.setMinutes(endDate.getMinutes() + (values.duration_minutes || 0));
      
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
        is_paid: values.is_paid,
        price: finalPrice,
      };

      logger.info("Submitting event to API:", eventInput);

      const result = await createEventMutation.mutateAsync({
        event: eventInput,
        hostId: user.id,
      });

      logger.info("Event created successfully:", result);
      
      // Store the created event ID so we can show the tag manager
      if (result?.id) {
        setCreatedEventId(result.id);
        toast.success("Event created! You can now add tags to your event.");
      } else {
        if (onSuccess) {
          logger.info("Calling onSuccess callback");
          onSuccess();
        } else {
          logger.info("No onSuccess callback, navigating to /events");
          navigate("/events");
        }
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Error creating event:", errorObj);
      handleError(errorObj);
      if (onError) onError(errorObj);
    }
  };

  return (
    <ErrorBoundary name="EventFormComponent">
      <div className="space-y-6">
        {!createdEventId ? (
          <>
            <h2 className="text-2xl font-bold">Create New Event</h2>
            
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
                  onTypeChange={setLocationFieldVisible} 
                  eventId={createdEventId}
                  isEditing={!!createdEventId}
                />
              </div>
              
              {/* Date and Time Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Date & Time</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="start_date"
                    control={form.control}
                    label="Start Date"
                    type="date"
                    required={true}
                  />
                  <FormInput
                    name="start_time"
                    control={form.control}
                    label="Start Time"
                    type="time"
                    required={true}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    name="duration_hours"
                    control={form.control}
                    label="Duration (Hours)"
                    type="number"
                    required={true}
                  />
                  <FormInput
                    name="duration_minutes"
                    control={form.control}
                    label="Duration (Minutes)"
                    type="number"
                    required={true}
                  />
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Location</h3>
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
              </div>
              
              {/* Price Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Pricing</h3>
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
                formId="event-form"
              />
            </FormWrapper>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Manage Event Tags</h2>
              <Button 
                onClick={() => navigate("/events")}
                className="bg-chosen-blue hover:bg-chosen-navy"
              >
                Go to Events
              </Button>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="mb-4">Your event was created successfully! Now you can add tags to help people find your event.</p>
              <EntityTagManager
                entityId={createdEventId}
                entityType={EntityType.EVENT}
                isAdmin={true}
                isEditing={true}
              />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

// Need to import Button for after event creation
import { Button } from "@/components/ui/button";

export default EventForm;
