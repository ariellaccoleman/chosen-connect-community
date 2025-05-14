
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEventMutations } from "@/hooks/useEventMutations";
import { useNavigate } from "react-router-dom";
import { CreateEventInput } from "@/types";
import { logger } from "@/utils/logger";
import { useFormError } from "@/hooks/useFormError";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { CreateEventForm } from "./form";
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
  const { handleError } = useFormError();
  
  const isSubmitting = createEventMutation.isPending;

  logger.info("EventForm component state", { 
    isSubmitting, 
    locationFieldVisible
  });

  const handleFormSubmit = async (eventInput: CreateEventInput) => {
    logger.info("EventForm handleFormSubmit called");
    
    if (!user?.id) {
      const error = new Error("Authentication error: No user ID found");
      logger.error(error.message);
      if (onError) onError(error);
      return;
    }

    try {
      logger.info("Processing form submission with user:", user.id);
      
      const result = await createEventMutation.mutateAsync({
        event: eventInput,
        hostId: user.id,
      });

      logger.info("Event created successfully:", result);
      
      // Show a success toast
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
        <h2 className="text-2xl font-bold">Create New Event</h2>
        <CreateEventForm 
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          onLocationTypeChange={(isVirtual) => setLocationFieldVisible(!isVirtual)}
        />
      </div>
    </ErrorBoundary>
  );
};

export default EventForm;
