
import React from "react";
import EventForm from "@/components/events/EventForm";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { logger } from "@/utils/logger";

const CreateEvent: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  logger.info("CreateEvent page rendering", { 
    userAuthenticated: !!user, 
    loading 
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
    navigate("/events");
  };

  return (
    <div className="container max-w-3xl py-8">
      <EventForm onSuccess={handleSuccess} />
    </div>
  );
};

export default CreateEvent;
