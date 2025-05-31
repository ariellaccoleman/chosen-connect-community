
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/config/routes";
import { PlusCircle, Calendar, AlertCircle } from "lucide-react";
import { useEvents } from "@/hooks/events"; 
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { logger } from "@/utils/logger";
import TagList from "@/components/tags/TagList";

const EventSection: React.FC = () => {
  const { data: events = [], isLoading, error, refetch } = useEvents();
  
  logger.info("EventSection rendering", { 
    eventCount: events.length, 
    isLoading, 
    hasError: !!error,
    events: events
  });
  
  // Get the 3 most recent upcoming events
  const upcomingEvents = events
    .filter(event => new Date(event.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 3);

  const formatEventDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy • h:mm a");
    } catch (e) {
      logger.error("Error formatting date:", e, { dateString });
      return "Date unavailable";
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Events</h2>
        <Button
          asChild
          size="sm"
          className="bg-chosen-blue hover:bg-chosen-navy"
        >
          <Link to={APP_ROUTES.CREATE_EVENT} className="flex items-center gap-1">
            <PlusCircle size={16} />
            <span>Create Event</span>
          </Link>
        </Button>
      </div>
      <p className="text-muted-foreground mb-4">
        Host a virtual or in-person event for the community.
      </p>
      
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center text-red-600 mb-2">
            <AlertCircle size={16} className="mr-2" />
            <span className="font-medium">Error loading events</span>
          </div>
          <p className="text-sm text-red-500">{error instanceof Error ? error.message : "Unknown error"}</p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => refetch()}
            className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
          >
            Try Again
          </Button>
        </div>
      ) : upcomingEvents.length > 0 ? (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Upcoming Events ({upcomingEvents.length})</h3>
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <div 
                key={event.id} 
                className="p-3 bg-gray-50 rounded-md border border-gray-100"
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-xs text-gray-500 flex items-center mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatEventDate(event.start_time)}
                </div>
                {event.tags && event.tags.length > 0 && (
                  <div className="mt-2">
                    <TagList tags={event.tags} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="pt-2">
            <Link 
              to={APP_ROUTES.EVENTS} 
              className="text-sm text-chosen-blue hover:underline"
            >
              View all events →
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200 text-center">
          <p className="text-gray-500 text-sm">No upcoming events</p>
          <Link 
            to={APP_ROUTES.EVENTS} 
            className="text-sm text-chosen-blue hover:underline block mt-2"
          >
            View all events →
          </Link>
        </div>
      )}
    </div>
  );
};

export default EventSection;
