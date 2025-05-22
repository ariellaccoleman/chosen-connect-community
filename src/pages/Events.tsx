
import React, { useEffect, useState } from "react";
import { useNavigate, generatePath } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Video, AlertCircle, RefreshCw, ExternalLink, Filter } from "lucide-react";
import { useEvents } from "@/hooks/events";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { EventWithDetails } from "@/types";
import { logger } from "@/utils/logger";
import TagList from "@/components/tags/TagList";
import EventCardRegistrationButton from "@/components/events/EventCardRegistrationButton";
import { APP_ROUTES } from "@/config/routes";
import TagFilter from "@/components/filters/TagFilter";
import { EntityType } from "@/types/entityTypes";
import { useSelectionTags } from "@/hooks/tags";

const Events: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const { data: events = [], isLoading, error, refetch } = useEvents();
  const { data: tagsResponse, isLoading: isTagsLoading } = useSelectionTags(EntityType.EVENT);
  
  // Extract tags from the response
  const tags = tagsResponse?.data || [];
  
  useEffect(() => {
    logger.info("Events page mounted");
    logger.debug("Events data:", { count: events.length, hasTagData: events.some(e => e.tags && e.tags.length > 0) });
    
    // Check event tags for debugging
    if (events.length > 0) {
      const eventsWithTags = events.filter(event => event.tags && event.tags.length > 0);
      if (eventsWithTags.length > 0) {
        logger.debug(`Found ${eventsWithTags.length} events with tags:`, 
          eventsWithTags.slice(0, 3).map(e => ({ 
            id: e.id, 
            title: e.title, 
            tags: e.tags?.map(t => t.tag?.name || t.tag_id) 
          }))
        );
      }
    }
    
    if (selectedTagIds.length > 0) {
      logger.debug("Filtering events by tags:", selectedTagIds);
    }
  }, [events.length, selectedTagIds]);

  const formatEventDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy • h:mm a");
    } catch (e) {
      logger.error("Error formatting date:", e, { dateString });
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

  const handleViewEvent = (eventId: string) => {
    // Use generatePath to correctly generate the event detail URL with the eventId parameter
    const eventUrl = generatePath(APP_ROUTES.EVENT_DETAIL, { eventId });
    navigate(eventUrl);
  };

  // Filter events based on selected tags
  const filteredEvents = selectedTagIds.length > 0
    ? events.filter(event => 
        event.tags && event.tags.some(tag => selectedTagIds.includes(tag.tag_id))
      )
    : events;
    
  // Debug filtered events
  useEffect(() => {
    if (selectedTagIds.length > 0) {
      logger.debug(`Filtered to ${filteredEvents.length} events out of ${events.length}`);
      if (filteredEvents.length > 0) {
        logger.debug("First few filtered events:", 
          filteredEvents.slice(0, 3).map(e => ({ 
            id: e.id, 
            title: e.title,
            tags: e.tags?.map(t => t.tag?.name || t.tag_id)
          }))
        );
      } else {
        logger.debug("No events match the selected tags");
      }
    }
  }, [filteredEvents.length, events.length, selectedTagIds]);

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Events</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => navigate("/events/create")}
            className="bg-chosen-blue hover:bg-chosen-navy flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6 w-full md:max-w-xs">
          <TagFilter
            selectedTagIds={selectedTagIds}
            onTagsSelect={setSelectedTagIds}
            tags={tags}
            isLoading={isTagsLoading}
            label="Filter Events by Tags"
            targetType={EntityType.EVENT}
          />
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-600 mb-2">
              <AlertCircle size={20} className="mr-2" />
              <h3 className="font-medium">Error loading events</h3>
            </div>
            <p className="text-red-500 mb-4">{error instanceof Error ? error.message : "Failed to load events. Please try again later."}</p>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div>
            <p className="text-gray-500 mb-6">
              {selectedTagIds.length > 0 
                ? "No events match your selected tag filters. Try selecting different tags or clear the filters."
                : "Your events will appear here. Refresh to check for new events."
              }
            </p>
            {selectedTagIds.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedTagIds([])}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {selectedTagIds.length > 0 
                ? `Found ${filteredEvents.length} matching event(s)`
                : `Found ${filteredEvents.length} event(s)`
              }
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="relative bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewEvent(event.id)}
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
                  
                  <h3 className="font-semibold text-lg mb-2 pr-24">{event.title}</h3>
                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">{event.description}</p>
                  
                  <div className="text-sm text-gray-600 mb-2 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {event.start_time && formatEventDate(event.start_time)}
                  </div>
                  
                  {renderLocationInfo(event)}
                  
                  {event.tags && event.tags.length > 0 && (
                    <div className="mt-2 mb-2">
                      <TagList tagAssignments={event.tags} />
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm text-gray-500">
                      {event.host && `Hosted by: ${event.host.first_name} ${event.host.last_name}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Events;
