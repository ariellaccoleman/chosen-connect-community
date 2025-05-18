
import { createApiFactory } from "@/api/core/factory";
import { EventRegistration } from "@/types";
import { logger } from "@/utils/logger";

interface EventRegistrationCreate {
  event_id: string;
  profile_id: string;
}

/**
 * API factory for event registrations
 */
export const eventRegistrationApiFactory = createApiFactory<
  EventRegistration,
  string,
  EventRegistrationCreate
>({
  tableName: "event_registrations",
  entityName: "EventRegistration",
  useQueryOperations: true,
  useMutationOperations: true,
  transformResponse: (data) => {
    logger.info("Transforming registration response:", data);
    return data as EventRegistration;
  }
});

// Extract commonly used operations
export const {
  getAll: getAllRegistrations,
  getById: getRegistrationById,
  create: createRegistration,
  delete: deleteRegistration
} = eventRegistrationApiFactory;

/**
 * Check if a user is registered for an event
 */
export const isUserRegistered = async (eventId: string, profileId: string): Promise<boolean> => {
  try {
    const response = await eventRegistrationApiFactory.getAll({
      filters: {
        event_id: eventId,
        profile_id: profileId
      }
    });
    
    if (response.error) throw response.error;
    
    return Array.isArray(response.data) && response.data.length > 0;
  } catch (error) {
    logger.error("Failed to check registration status:", error);
    return false;
  }
};

/**
 * Get registration count for an event
 */
export const getRegistrationCount = async (eventId: string): Promise<number> => {
  try {
    const response = await eventRegistrationApiFactory.getAll({
      filters: {
        event_id: eventId
      }
    });
    
    if (response.error) throw response.error;
    
    return Array.isArray(response.data) ? response.data.length : 0;
  } catch (error) {
    logger.error("Failed to get registration count:", error);
    return 0;
  }
};

/**
 * Get all registrations with user profiles for an event
 */
export const getEventRegistrants = async (eventId: string): Promise<EventRegistration[]> => {
  try {
    // Using custom query to join with profiles
    const result = await eventRegistrationApiFactory.tableName;
    
    // For now, we'll use the old implementation approach for this complex query
    // We'll refactor the underlying repository layer in a future update
    const { data, error } = await apiClient.query(async (client) => {
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

      return { data, error };
    });

    if (error) throw error;

    return data as EventRegistration[];
  } catch (error) {
    logger.error("Failed to get event registrants:", error);
    return [];
  }
};

// Import apiClient for the custom query
import { apiClient } from "@/api/core/apiClient";
