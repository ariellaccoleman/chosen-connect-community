
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Loader } from "lucide-react";
import { useEventById } from "@/hooks/events";
import EventDetails from "@/components/events/EventDetails";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/utils/logger";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import EventForm from "@/components/events/EventForm";

const EventDetailContent = () => {
  // Use the correct parameter name (eventId) to match the route definition in APP_ROUTES.EVENT_DETAIL
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: event, isLoading, error } = useEventById(eventId);
  const [isEditing, setIsEditing] = useState(false);

  // Use optional chaining to safely access host_id
  const isOwner = user?.id && event && event.host_id === user.id;

  logger.info("EventDetail rendering", {
    eventId,
    isLoading,
    hasEvent: !!event,
    isOwner,
    userId: user?.id,
    hostId: event?.host_id
  });

  const handleBack = () => {
    navigate("/events");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-chosen-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-md">
        <h3 className="font-bold">Error loading event</h3>
        <p>{error instanceof Error ? error.message : "Unknown error occurred"}</p>
        <Button onClick={handleBack} variant="outline" className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-amber-50 text-amber-800 p-4 rounded-md">
        <h3 className="font-bold">Event not found</h3>
        <p>The event you're looking for doesn't exist or has been removed.</p>
        <Button onClick={handleBack} variant="outline" className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  if (isEditing && isOwner) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button
            onClick={() => setIsEditing(false)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Event Details
          </Button>
        </div>
        
        {/* Show EventForm in edit mode */}
        <EventForm 
          eventData={event}
          onSuccess={() => {
            setIsEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          onClick={handleBack}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Button>
        {isOwner && (
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsEditing(true)} 
              className="flex items-center gap-2 bg-chosen-blue hover:bg-chosen-navy"
            >
              <Edit className="h-4 w-4" />
              Edit Event
            </Button>
          </div>
        )}
      </div>

      <EventDetails event={event} isAdmin={isOwner} />
    </div>
  );
};

const EventDetail = () => {
  return (
    <ErrorBoundary name="EventDetailPage">
      <div className="container max-w-3xl py-8">
        <EventDetailContent />
      </div>
    </ErrorBoundary>
  );
};

export default EventDetail;
