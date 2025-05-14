
import React from "react";
import EntityTagManager from "@/components/tags/EntityTagManager";
import { EntityType } from "@/types/entityTypes";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

interface EventTagsManagerProps {
  eventId: string;
}

const EventTagsManager = ({ eventId }: EventTagsManagerProps) => {
  const navigate = useNavigate();

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
