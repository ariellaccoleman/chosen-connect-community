import { CreateEventInput, EventWithDetails } from "@/types";
import { apiClient } from "./core/apiClient";
import { ApiResponse, createErrorResponse, createSuccessResponse } from "./core/errorHandler";
import { formatDateForDb } from "@/utils/formatters/index";
import { logger } from "@/utils/logger";

/**
 * API methods for events
 */
export const eventsApi = {
  /**
   * Create a new event
   */
  async createEvent(event: CreateEventInput, hostId: string): Promise<ApiResponse<EventWithDetails>> {
    try {
      logger.info("Creating event with data:", { ...event, host_id: hostId });
      
      const { data, error } = await apiClient.query(async (client) => {
        return client.from("events").insert({
          title: event.title,
          description: event.description,
          start_time: formatDateForDb(event.start_time),
          end_time: formatDateForDb(event.end_time),
          is_virtual: event.is_virtual,
          location_id: event.is_virtual ? null : event.location_id,
          host_id: hostId,
          is_paid: event.is_paid,
          price: event.is_paid ? event.price : null,
        }).select().single();
      });

      if (error) {
        logger.error("Supabase error creating event:", error);
        return createErrorResponse({
          code: error.code || "unknown_error",
          message: error.message || "Failed to create event: " + (error.details || "unknown error"),
          details: error
        });
      }

      // Tag assignments will be handled by EntityTagManager component
      // using the useTagAssignmentMutations hook directly

      return createSuccessResponse(data as EventWithDetails);
    } catch (error) {
      logger.error("Exception creating event:", error);
      const message = error instanceof Error ? error.message : "Unknown error creating event";
      return createErrorResponse({
        code: "exception",
        message: message,
        details: error
      });
    }
  },

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, event: CreateEventInput): Promise<ApiResponse<EventWithDetails>> {
    try {
      logger.info("Updating event with data:", { id: eventId, ...event });
      
      const { data, error } = await apiClient.query(async (client) => {
        return client.from("events").update({
          title: event.title,
          description: event.description,
          start_time: formatDateForDb(event.start_time),
          end_time: formatDateForDb(event.end_time),
          is_virtual: event.is_virtual,
          location_id: event.is_virtual ? null : event.location_id,
          is_paid: event.is_paid,
          price: event.is_paid ? event.price : null,
        })
        .eq('id', eventId)
        .select()
        .single();
      });

      if (error) {
        logger.error("Supabase error updating event:", error);
        return createErrorResponse({
          code: error.code || "unknown_error",
          message: error.message || "Failed to update event: " + (error.details || "unknown error"),
          details: error
        });
      }

      return createSuccessResponse(data as EventWithDetails);
    } catch (error) {
      logger.error("Exception updating event:", error);
      const message = error instanceof Error ? error.message : "Unknown error updating event";
      return createErrorResponse({
        code: "exception",
        message: message,
        details: error
      });
    }
  },

  /**
   * Get events
   */
  async getEvents(): Promise<ApiResponse<EventWithDetails[]>> {
    try {
      logger.info("Fetching events from API...");
      
      const { data, error } = await apiClient.query(async (client) => {
        // First, fetch all events with their locations and hosts
        const { data: events, error: eventsError } = await client
          .from("events")
          .select(`
            *,
            location:locations(*),
            host:profiles(*)
          `)
          .order("start_time", { ascending: true });
          
        if (eventsError) {
          logger.error("Error fetching events:", eventsError);
          return { data: null, error: eventsError };
        }
        
        logger.info(`Found ${events?.length || 0} events`);
        
        // For each event, fetch its tags
        if (events && events.length > 0) {
          const eventsWithTags = await Promise.all(events.map(async (event) => {
            const { data: tagAssignments, error: tagError } = await client
              .from('tag_assignments')
              .select(`
                *,
                tag:tags(*)
              `)
              .eq('target_id', event.id)
              .eq('target_type', 'event');
              
            if (tagError) {
              logger.error(`Error fetching tags for event ${event.id}:`, tagError);
              return { ...event, tags: [] };
            }
            
            logger.info(`Found ${tagAssignments?.length || 0} tags for event ${event.id}`);
            return { ...event, tags: tagAssignments || [] };
          }));
          
          return { data: eventsWithTags, error: null };
        }
        
        return { data: events || [], error: null };
      });

      if (error) {
        logger.error("Error in getEvents:", error);
        return createErrorResponse(error);
      }

      return createSuccessResponse(data as EventWithDetails[]);
    } catch (error) {
      logger.error("Exception in getEvents:", error);
      return createErrorResponse(error);
    }
  },

  /**
   * Get event by ID
   */
  async getEventById(eventId: string): Promise<ApiResponse<EventWithDetails>> {
    try {
      logger.info(`Fetching event with ID: ${eventId}`);
      
      const { data, error } = await apiClient.query(async (client) => {
        // Fetch the event with its location and host
        const { data: event, error: eventError } = await client
          .from("events")
          .select(`
            *,
            location:locations(*),
            host:profiles(*)
          `)
          .eq("id", eventId)
          .single();
          
        if (eventError) {
          logger.error(`Error fetching event ${eventId}:`, eventError);
          return { data: null, error: eventError };
        }
        
        if (!event) {
          return { 
            data: null, 
            error: { message: `Event with ID ${eventId} not found` } 
          };
        }
        
        logger.info(`Found event:`, event);
        
        // Fetch the event's tags
        const { data: tagAssignments, error: tagError } = await client
          .from('tag_assignments')
          .select(`
            *,
            tag:tags(*)
          `)
          .eq('target_id', eventId)
          .eq('target_type', 'event');
          
        if (tagError) {
          logger.error(`Error fetching tags for event ${eventId}:`, tagError);
          // Return event without tags if there's an error fetching tags
          return { data: { ...event, tags: [] }, error: null };
        }
        
        logger.info(`Found ${tagAssignments?.length || 0} tags for event ${eventId}`);
        
        // Combine the event with its tags
        const eventWithTags = {
          ...event,
          tags: tagAssignments || []
        };
        
        return { data: eventWithTags, error: null };
      });

      if (error) {
        logger.error(`Error in getEventById:`, error);
        return createErrorResponse(error);
      }

      return createSuccessResponse(data as EventWithDetails);
    } catch (error) {
      logger.error(`Exception in getEventById:`, error);
      return createErrorResponse(error);
    }
  }
};
