
import { CreateEventInput, EventWithDetails } from "@/types";
import { apiClient } from "./core/apiClient";
import { createErrorResponse, createSuccessResponse } from "./core/errorHandler";
import { formatDateForDb } from "@/utils/formatters/index";
import { ApiResponse } from "./core/errorHandler";

/**
 * API methods for events
 */
export const eventsApi = {
  /**
   * Create a new event
   */
  async createEvent(event: CreateEventInput, hostId: string): Promise<ApiResponse<EventWithDetails>> {
    try {
      console.log("Creating event with data:", { ...event, host_id: hostId });
      
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
          tag_id: event.tag_id || null,
        }).select().single();
      });

      if (error) {
        console.error("Supabase error creating event:", error);
        return createErrorResponse({
          code: error.code || "unknown_error",
          message: error.message || "Failed to create event: " + (error.details || "unknown error"),
          details: error
        });
      }
      
      // If a tag was selected, create a tag assignment
      if (event.tag_id && data) {
        try {
          await apiClient.query(async (client) => {
            const { error: tagError } = await client.from('tag_assignments').insert({
              tag_id: event.tag_id,
              target_id: data.id,
              target_type: 'event'
            });
            
            if (tagError) {
              console.error("Error creating tag assignment for event:", tagError);
            }
          });
        } catch (tagErr) {
          console.error("Exception creating tag assignment:", tagErr);
          // Don't fail the event creation if tag assignment fails
        }
      }

      return createSuccessResponse(data as EventWithDetails);
    } catch (error) {
      console.error("Exception creating event:", error);
      const message = error instanceof Error ? error.message : "Unknown error creating event";
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
      const { data, error } = await apiClient.query(async (client) => {
        const events = await client
          .from("events")
          .select(`
            *,
            location:locations(*),
            host:profiles(*)
          `)
          .order("start_time", { ascending: true });
          
        if (events.error) throw events.error;
        
        // For each event, fetch its tags
        const eventsWithTags = await Promise.all((events.data || []).map(async (event) => {
          const { data: tagAssignments, error: tagError } = await client
            .from('tag_assignments')
            .select(`
              *,
              tag:tags(*)
            `)
            .eq('target_id', event.id)
            .eq('target_type', 'event');
            
          if (tagError) {
            console.error(`Error fetching tags for event ${event.id}:`, tagError);
            return { ...event, tags: [] };
          }
          
          return { ...event, tags: tagAssignments || [] };
        }));
        
        return eventsWithTags;
      });

      if (error) {
        return createErrorResponse(error);
      }

      return createSuccessResponse(data as EventWithDetails[]);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
};
