
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Events: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Events</h1>
        <Button 
          onClick={() => navigate("/events/create")}
          className="bg-chosen-blue hover:bg-chosen-navy"
        >
          Create Event
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 mb-6">Your events will appear here.</p>
      </div>
    </div>
  );
};

export default Events;
