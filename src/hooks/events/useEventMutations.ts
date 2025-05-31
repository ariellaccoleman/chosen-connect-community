
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EventWithDetails, CreateEventInput } from "@/types";
import { extendedEventApi } from "@/api/events/eventApiFactory";
import { logger } from "@/utils/logger";

/**
 * Hook for event mutations (create, update, delete)
 */
export const useEventMutations = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async ({ event, hostId, tagIds }: { 
      event: CreateEventInput, 
      hostId: string,
      tagIds?: string[] 
    }) => {
      logger.info("Creating event", { event, hostId, tagIds });
      
      try {
        // Create the event with host_id
        const result = await extendedEventApi.create({ ...event, host_id: hostId } as any);
        
        if (result.error) {
          logger.error("API returned error:", result.error);
          throw result.error;
        }
        
        return result.data;
      } catch (err) {
        logger.error("Error creating event", err);
        // Format the error message properly
        if (err instanceof Error) {
          throw err;
        } else if (typeof err === 'object' && err !== null) {
          const errorMsg = err.message || JSON.stringify(err);
          throw new Error(`Failed to create event: ${errorMsg}`);
        } else {
          throw new Error(`Failed to create event: ${String(err)}`);
        }
      }
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error: Error) => {
      logger.error("Error creating event", error);
      setError(error);
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, eventData }: { 
      eventId: string, 
      eventData: Partial<CreateEventInput> 
    }) => {
      logger.info("Updating event", { eventId, eventData });
      const result = await extendedEventApi.update(eventId, eventData);
      if (result.error) {
        logger.error("API returned error:", result.error);
        throw new Error(result.error.message || "Failed to update event");
      }
      return result.data;
    },
    onSuccess: (data) => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", data.id] });
    },
    onError: (error: Error) => {
      logger.error("Error updating event", error);
      setError(error);
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      logger.info("Deleting event", { eventId });
      const result = await extendedEventApi.delete(eventId);
      if (result.error) {
        logger.error("API returned error:", result.error);
        throw new Error(result.error.message || "Failed to delete event");
      }
      return eventId;
    },
    onSuccess: (eventId) => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
    },
    onError: (error: Error) => {
      logger.error("Error deleting event", error);
      setError(error);
    }
  });

  return {
    createEventMutation,
    updateEventMutation,
    deleteEventMutation,
    error
  };
};
