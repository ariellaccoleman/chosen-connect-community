
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EventWithDetails, CreateEventInput } from "@/types";
import { extendedEventsApi } from "@/api/events/eventsApi";
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
      
      // Use extended API to create event with tags if provided
      const result = tagIds && tagIds.length > 0
        ? await extendedEventsApi.createEventWithTags(event, hostId, tagIds)
        : await extendedEventsApi.create({ ...event, host_id: hostId });
      
      if (result.error) throw result.error;
      return result.data;
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
      const result = await extendedEventsApi.update(eventId, eventData);
      if (result.error) throw result.error;
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
      const result = await extendedEventsApi.delete(eventId);
      if (result.error) throw result.error;
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
