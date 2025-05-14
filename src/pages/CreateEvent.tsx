
import React from "react";
import { useNavigate } from "react-router-dom";
import EventForm from "@/components/events/EventForm";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const CreateEvent: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  if (loading) {
    return <div className="container py-8">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="container max-w-3xl py-8">
      <EventForm onCancel={handleCancel} />
    </div>
  );
};

export default CreateEvent;
