
import React, { useState } from "react";
import { EventWithDetails } from "@/types";
import { Calendar, MapPin, Video, DollarSign, UserCheck, Users } from "lucide-react";
import { format } from "date-fns";
import EntityTagManager from "../tags/EntityTagManager";
import { EntityType } from "@/types/entityTypes";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/utils/logger";
import EventRegistrationButton from "./EventRegistrationButton";

interface EventDetailsProps {
  event: EventWithDetails;
  isAdmin?: boolean;
}

const EventDetails = ({ event, isAdmin = false }: EventDetailsProps) => {
  const { user } = useAuth();
  
  // Explicitly log auth status and host matching for debugging
  React.useEffect(() => {
    if (event && user) {
      logger.info("EventDetails - checking host status:", {
        eventId: event.id,
        eventHostId: event.host_id,
        currentUserId: user.id,
        isHost: event.host_id === user.id,
        isAdminProp: isAdmin
      });
    }
  }, [event, user, isAdmin]);

  const formatEventDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "EEEE, MMMM d, yyyy • h:mm a");
    } catch (e) {
      return "Date unavailable";
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">{event.title}</h2>
      
      {/* Host info with badge */}
      {event.host && (
        <div className="flex items-center mb-4 bg-blue-50 p-2 rounded">
          <UserCheck className="h-5 w-5 mr-2 text-blue-500" />
          <span className="text-sm">
            Hosted by: <span className="font-medium">{event.host.first_name} {event.host.last_name}</span>
            {isAdmin && <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">You are the host</span>}
          </span>
        </div>
      )}
      
      {/* Date and Time */}
      {event.start_time && (
        <div className="flex items-center text-gray-600 mb-4">
          <Calendar className="h-5 w-5 mr-2" />
          <div>
            <div>{formatEventDate(event.start_time)}</div>
            {event.end_time && (
              <div className="text-sm text-gray-500">
                Until {format(new Date(event.end_time), "h:mm a")}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Location */}
      {event.is_virtual ? (
        <div className="flex items-center text-gray-600 mb-4">
          <Video className="h-5 w-5 mr-2" />
          <span>Virtual Event</span>
        </div>
      ) : event.location ? (
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="h-5 w-5 mr-2" />
          <span>{event.location.full_name}</span>
        </div>
      ) : null}
      
      {/* Price */}
      {event.is_paid && (
        <div className="flex items-center text-gray-600 mb-4">
          <DollarSign className="h-5 w-5 mr-2" />
          <span>{event.price ? `$${event.price}` : 'Paid Event'}</span>
        </div>
      )}
      
      {/* Registration button */}
      <div className="my-6 p-4 border border-gray-200 rounded-md bg-gray-50">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <Users className="h-5 w-5 mr-2 text-chosen-blue" />
          Event Registration
        </h3>
        <EventRegistrationButton eventId={event.id} />
      </div>
      
      {/* Description */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Description</h3>
        <p className="text-gray-700 whitespace-pre-line">{event.description || 'No description provided.'}</p>
      </div>
      
      {/* Host information */}
      {event.host && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Hosted by</h3>
          <div className="flex items-center">
            {event.host.avatar_url ? (
              <img 
                src={event.host.avatar_url} 
                alt={`${event.host.first_name} ${event.host.last_name}`}
                className="w-10 h-10 rounded-full mr-3"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                {event.host.first_name?.[0] || ''}
                {event.host.last_name?.[0] || ''}
              </div>
            )}
            <div>
              <div className="font-medium">
                {event.host.first_name} {event.host.last_name}
              </div>
              {event.host.headline && (
                <div className="text-sm text-gray-500">{event.host.headline}</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Tags */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Tags</h3>
        <EntityTagManager
          entityId={event.id}
          entityType={EntityType.EVENT}
          isAdmin={isAdmin}
          isEditing={isAdmin}
          onTagSuccess={() => logger.info(`Tag operation successful for event ${event.id}`)}
          onTagError={(err) => logger.error(`Tag error for event ${event.id}:`, err)}
        />
      </div>
    </div>
  );
};

export default EventDetails;
