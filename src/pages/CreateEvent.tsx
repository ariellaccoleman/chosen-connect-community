
import React, { useState } from "react";
import EventForm from "@/components/events/EventForm";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { logger } from "@/utils/logger";
import { toast } from "sonner";
import ErrorBoundary from "@/components/common/ErrorBoundary";

const CreateEventContent: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<Error | null>(null);
  
  logger.info("CreateEvent content rendering", { 
    userAuthenticated: !!user, 
    loading,
    hasFormError: !!formError
  });
  
  if (loading) {
    return <div className="container py-8">Loading...</div>;
  }
  
  if (!user) {
    logger.info("User not authenticated, redirecting to auth page");
    return <Navigate to="/auth" replace />;
  }

  const handleSuccess = () => {
    logger.info("Event created successfully, navigating to events page");
    toast.success("Event created successfully!");
    navigate("/events");
  };

  const handleError = (error: Error) => {
    logger.error("Error in event form", error);
    setFormError(error);
    toast.error("Failed to create event: " + error.message);
  };

  try {
    return (
      <div className="container max-w-3xl py-8">
        <EventForm onSuccess={handleSuccess} onError={handleError} />
      </div>
    );
  } catch (error) {
    logger.error("Unexpected error rendering event form", error);
    setFormError(error instanceof Error ? error : new Error(String(error)));
    return (
      <div className="container max-w-3xl py-8">
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Error Rendering Form</h3>
          <p className="mt-2 text-red-700">
            There was a problem displaying the event form. Please try again later.
          </p>
        </div>
      </div>
    );
  }
};

const CreateEvent: React.FC = () => {
  logger.info("CreateEvent page container rendering");
  
  return (
    <ErrorBoundary name="CreateEventPage">
      <CreateEventContent />
    </ErrorBoundary>
  );
};

export default CreateEvent;
