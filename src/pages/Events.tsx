
import React, { useState } from "react";
import { useNavigate, generatePath } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Video, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { useEvents } from "@/hooks/events";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { EventWithDetails } from "@/types";
import { logger } from "@/utils/logger";
import TagList from "@/components/tags/TagList";
import EventCardRegistrationButton from "@/components/events/EventCardRegistrationButton";
import { APP_ROUTES } from "@/config/routes";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { EntityType } from "@/types/entityTypes";
import { useFilterByTag } from "@/hooks/tags";
import { toast } from "sonner";
import TagSelector from "@/components/tags/TagSelector";
import { Tag } from "@/utils/tags";

const Events: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for selected tag
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  
  // Use tag hook for filtering
  const { data: tagAssignments = [] } = useFilterByTag(selectedTagId, EntityType.EVENT);
  
  const { data: events = [], isLoading, error, refetch } = useEvents();
  
  // Log page load for debugging
  logger.info("Events page mounted");
  logger.debug("Events data:", { count: events.length, hasTagData: events.some(e => e.tags && e.tags.length > 0) });
  
  // Show error toast if events loading fails
  if (error) {
    logger.error("Error fetching events:", error);
    toast.error("Failed to load events. Please try again.");
  }

  // First filter by search term
  const searchFilteredEvents = events.filter((event) => {
    return event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.location?.full_name && event.location.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
  });
  
  // Then filter by tag id if selected
  const filteredEvents = selectedTagId
    ? searchFilteredEvents.filter(event => {
        const taggedIds = new Set(tagAssignments.map((ta) => ta.target_id));
        return taggedIds.has(event.id);
      })
    : searchFilteredEvents;
    
  // Debug filtered events
  React.useEffect(() => {
    if (selectedTagId) {
      logger.debug(`Filtered to ${filteredEvents.length} events out of ${events.length}`);
    }
  }, [filteredEvents.length, events.length, selectedTagId]);

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
    const eventUrl = generatePath(APP_ROUTES.EVENT_DETAIL, { eventId });
    navigate(eventUrl);
  };
  
  // Handle tag selection
  const handleTagSelected = (tag: Tag) => {
    setSelectedTagId(tag.id || null);
    logger.debug(`Selected tag: ${tag.name} (${tag.id})`);
  };
  
  // Clear tag filter
  const clearTagFilter = () => {
    setSelectedTagId(null);
  };

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
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search events by name, description, or location"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-64">
              <TagSelector 
                targetType={EntityType.EVENT}
                onTagSelected={handleTagSelected}
                currentSelectedTagId={selectedTagId}
              />
              {selectedTagId && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearTagFilter}
                  className="mt-2"
                >
                  Clear filter
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
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
        <div className="text-center py-12">
          <p className="text-gray-500">
            {selectedTagId 
              ? "No events match your selected tag. Try selecting a different tag or clear the filter."
              : searchTerm 
                ? "No events match your search. Try different keywords."
                : "Your events will appear here. Refresh to check for new events."
            }
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {selectedTagId 
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
  );
};

export default Events;
