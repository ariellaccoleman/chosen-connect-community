
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
        return client
          .from("events")
          .select(`
            *,
            location:locations(*),
            host:profiles(*)
          `)
          .order("start_time", { ascending: true });
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
