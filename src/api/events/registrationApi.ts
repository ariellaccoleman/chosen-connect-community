
import { apiClient } from "../core/apiClient";
import { createSuccessResponse, createErrorResponse } from "../core/errorHandler";
import { ApiResponse } from "../core/types";
import { EventRegistration } from "@/types";
import { logger } from "@/utils/logger";

/**
 * API functions for event registrations
 */
export const eventRegistrationApi = {
  /**
   * Register current user for an event
   */
  async registerForEvent(
    eventId: string, 
    profileId: string
  ): Promise<ApiResponse<EventRegistration>> {
    try {
      logger.info(`Registering user ${profileId} for event ${eventId}`);
      
      return await apiClient.query(async (client) => {
        const { data, error } = await client
          .from("event_registrations")
          .insert({
            event_id: eventId,
            profile_id: profileId,
          })
          .select("*")
          .single();

        if (error) {
          // Check if it's a duplicate registration error
          if (error.code === '23505') {
            return createErrorResponse(new Error("You are already registered for this event"));
          }
          throw error;
        }

        return createSuccessResponse(data as EventRegistration);
      });
    } catch (error) {
      logger.error("Failed to register for event:", error);
      return createErrorResponse(error);
    }
  },

  /**
   * Cancel registration for an event
   */
  async cancelRegistration(
    eventId: string,
    profileId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      logger.info(`Cancelling registration for user ${profileId} for event ${eventId}`);
      
      return await apiClient.query(async (client) => {
        const { error } = await client
          .from("event_registrations")
          .delete()
          .match({
            event_id: eventId,
            profile_id: profileId,
          });

        if (error) throw error;

        return createSuccessResponse(true);
      });
    } catch (error) {
      logger.error("Failed to cancel event registration:", error);
      return createErrorResponse(error);
    }
  },

  /**
   * Check if user is registered for an event
   */
  async isUserRegistered(
    eventId: string,
    profileId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      logger.info(`Checking if user ${profileId} is registered for event ${eventId}`);
      
      return await apiClient.query(async (client) => {
        const { data, error, count } = await client
          .from("event_registrations")
          .select("*", { count: 'exact', head: true })
          .match({
            event_id: eventId,
            profile_id: profileId,
          });

        if (error) throw error;

        return createSuccessResponse(count !== null && count > 0);
      });
    } catch (error) {
      logger.error("Failed to check registration status:", error);
      return createErrorResponse(error);
    }
  },

  /**
   * Get number of registrations for an event
   */
  async getRegistrationCount(eventId: string): Promise<ApiResponse<number>> {
    try {
      logger.info(`Getting registration count for event ${eventId}`);
      
      return await apiClient.query(async (client) => {
        const { count, error } = await client
          .from("event_registrations")
          .select("*", { count: 'exact', head: true })
          .eq("event_id", eventId);

        if (error) throw error;

        return createSuccessResponse(count || 0);
      });
    } catch (error) {
      logger.error("Failed to get registration count:", error);
      return createErrorResponse(error);
    }
  },

  /**
   * Get all registrations with user profiles for an event
   * Only the event host should be able to access this
   */
  async getEventRegistrants(eventId: string): Promise<ApiResponse<EventRegistration[]>> {
    try {
      logger.info(`Getting registrations with profiles for event ${eventId}`);
      
      return await apiClient.query(async (client) => {
        const { data, error } = await client
          .from("event_registrations")
          .select(`
            id, 
            event_id,
            profile_id,
            created_at,
            profile:profiles(id, first_name, last_name, email, avatar_url, headline)
          `)
          .eq("event_id", eventId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return createSuccessResponse(data as EventRegistration[]);
      });
    } catch (error) {
      logger.error("Failed to get event registrants:", error);
      return createErrorResponse(error);
    }
  }
};

// Export API functions for direct usage
export const {
  registerForEvent,
  cancelRegistration,
  isUserRegistered,
  getRegistrationCount,
  getEventRegistrants
} = eventRegistrationApi;
