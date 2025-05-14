
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Video } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { EventWithDetails } from "@/types";

const Events: React.FC = () => {
  const navigate = useNavigate();
  const { data: events = [], isLoading, error } = useEvents();
  
  useEffect(() => {
    console.log("Events page mounted");
  }, []);

  const formatEventDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy • h:mm a");
    } catch (e) {
      return "Date unavailable";
    }
  };

  const renderLocationInfo = (event: EventWithDetails) => {
    if (event.is_virtual) {
      return (
        <div className="flex items-center text-gray-500 text-sm">
          <Video className="h-3 w-3 mr-1" />
          <span>Virtual Event</span>
        </div>
      );
    }
    
    if (event.location?.full_name) {
      return (
        <div className="flex items-center text-gray-500 text-sm">
          <MapPin className="h-3 w-3 mr-1" />
          <span>{event.location.full_name}</span>
        </div>
      );
    }
    
    return null;
  };

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
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ) : error ? (
          <p className="text-red-500">Error loading events. Please try again later.</p>
        ) : events.length === 0 ? (
          <div>
            <p className="text-gray-500 mb-6">Your events will appear here.</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-48 flex items-center justify-center">
                <p className="text-gray-400 text-center">No events yet</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                <p className="text-gray-700 text-sm mb-3 line-clamp-2">{event.description}</p>
                
                <div className="text-sm text-gray-600 mb-2">
                  {event.start_time && formatEventDate(event.start_time)}
                </div>
                
                {renderLocationInfo(event)}
                
                {event.host && (
                  <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                    Hosted by: {event.host.first_name} {event.host.last_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
