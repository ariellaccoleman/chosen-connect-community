
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEventMutations } from "@/hooks/useEventMutations";
import { useNavigate } from "react-router-dom";
import { CreateEventInput, EventWithDetails } from "@/types";
import { logger } from "@/utils/logger";
import { useFormError } from "@/hooks/useFormError";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { CreateEventForm } from "./form";
import { toast } from "sonner";

interface EventFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  eventData?: EventWithDetails; // Add prop for edit mode
}

const EventForm: React.FC<EventFormProps> = ({ onSuccess, onError, eventData }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createEventMutation, updateEventMutation } = useEventMutations();
  const [locationFieldVisible, setLocationFieldVisible] = useState(
    eventData ? !eventData.is_virtual : false
  );
  const { handleError } = useFormError();
  
  const isSubmitting = createEventMutation.isPending || updateEventMutation.isPending;
  const isEditMode = !!eventData;

  logger.info("EventForm component state", { 
    isSubmitting, 
    locationFieldVisible,
    isEditMode,
    eventId: eventData?.id
  });

  const handleFormSubmit = async (eventInput: CreateEventInput) => {
    logger.info("EventForm handleFormSubmit called", { isEditMode });
    
    if (!user?.id) {
      const error = new Error("Authentication error: No user ID found");
      logger.error(error.message);
      if (onError) onError(error);
      return;
    }

    try {
      if (isEditMode && eventData) {
        logger.info("Updating event", { eventId: eventData.id });
        
        const result = await updateEventMutation.mutateAsync({
          eventId: eventData.id,
          eventData: eventInput,
        });

        logger.info("Event updated successfully:", result);
        toast.success("Event updated successfully!");
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        logger.info("Creating new event with user:", user.id);
        
        const result = await createEventMutation.mutateAsync({
          event: eventInput,
          hostId: user.id,
        });

        logger.info("Event created successfully:", result);
        toast.success("Event created successfully!");
        
        // Navigate to the event detail page
        if (result?.id) {
          logger.info(`Navigating to event detail page: ${result.id}`);
          navigate(`/events/${result.id}`);
        } else {
          if (onSuccess) {
            logger.info("Calling onSuccess callback");
            onSuccess();
          } else {
            logger.info("No onSuccess callback, navigating to /events");
            navigate("/events");
          }
        }
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Error saving event:", errorObj);
      handleError(errorObj);
      if (onError) onError(errorObj);
    }
  };

  return (
    <ErrorBoundary name="EventFormComponent">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">
          {isEditMode ? "Edit Event" : "Create New Event"}
        </h2>
        <CreateEventForm 
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          onLocationTypeChange={(isVirtual) => setLocationFieldVisible(!isVirtual)}
          eventData={eventData}
        />
      </div>
    </ErrorBoundary>
  );
};

export default EventForm;
