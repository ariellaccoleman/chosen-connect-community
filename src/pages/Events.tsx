
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

const Events: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Log when the component mounts for debugging
    console.log("Events page mounted");
  }, []);

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Events</h1>
        <Button 
          onClick={() => navigate("/events/create")}
          className="bg-chosen-blue hover:bg-chosen-navy flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Create Event
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 mb-6">Your events will appear here.</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder for event cards */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-48 flex items-center justify-center">
            <p className="text-gray-400 text-center">No events yet</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
