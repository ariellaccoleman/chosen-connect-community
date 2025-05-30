
import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Video, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Entity } from "@/types/entity";
import SimpleTagList from "@/components/tags/SimpleTagList";
import EventCardRegistrationButton from "./EventCardRegistrationButton";

interface EventCardProps {
  event: Entity;
  onViewEvent: (eventId: string) => void;
}

const EventCard = ({ event, onViewEvent }: EventCardProps) => {
  const formatEventDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy • h:mm a");
    } catch (e) {
      return "Date unavailable";
    }
  };

  const renderLocationInfo = (event: any) => {
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
    <div 
      className="relative bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onViewEvent(event.id)}
    >
      {/* Registration button positioned in top right */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
        <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <EventCardRegistrationButton eventId={event.id} />
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-chosen-blue hover:text-chosen-navy flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          View
        </Button>
      </div>
      
      <h3 className="font-semibold text-lg mb-2 pr-24">{event.name}</h3>
      <p className="text-gray-700 text-sm mb-3 line-clamp-2">{event.description}</p>
      
      <div className="text-sm text-gray-600 mb-2 flex items-center">
        <Calendar className="h-3 w-3 mr-1" />
        {(event as any).start_time && formatEventDate((event as any).start_time)}
      </div>
      
      {renderLocationInfo(event)}
      
      {event.tags && event.tags.length > 0 && (
        <div className="mt-2 mb-2">
          <SimpleTagList tags={event.tags} />
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t">
        <div className="text-sm text-gray-500">
          {(event as any).host && `Hosted by: ${(event as any).host.first_name} ${(event as any).host.last_name}`}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
