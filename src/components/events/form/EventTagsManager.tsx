
import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import EntityTagManager from "@/components/tags/EntityTagManager";
import { EntityType } from "@/types/entityTypes";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logger } from "@/utils/logger";
import { Skeleton } from "@/components/ui/skeleton";

interface EventTagsManagerProps {
  eventId: string;
}

const EventTagsManager = ({ eventId }: EventTagsManagerProps) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Log component mounting for debugging
  React.useEffect(() => {
    logger.info(`EventTagsManager mounted for event ${eventId}`);
  }, [eventId]);

  const handleTagSuccess = () => {
    toast.success("Tag added successfully to your event");
  };

  const handleTagError = (error: Error) => {
    toast.error(`Error adding tag: ${error.message}`);
    logger.error("Error in event tag management:", error);
  };

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }
  
  // If not authenticated, redirect to auth page
  if (!user) {
    logger.warn("Unauthenticated user attempted to access EventTagsManager");
    return <Navigate to="/auth" state={{ from: `/events/${eventId}/tags` }} replace />;
  }

  return (
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
          entityId={eventId}
          entityType={EntityType.EVENT}
          isAdmin={true}
          isEditing={true}
          onTagSuccess={handleTagSuccess}
          onTagError={handleTagError}
        />
      </div>
    </div>
  );
};

export default EventTagsManager;
