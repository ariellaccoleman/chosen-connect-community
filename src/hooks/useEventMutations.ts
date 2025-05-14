
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "@/api";
import { CreateEventInput } from "@/types";
import { showErrorToast } from "@/api/core/errorHandler";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

export function useEventMutations() {
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: async ({ event, hostId }: { event: CreateEventInput, hostId: string }) => {
      console.log("In createEventMutation mutationFn with:", { event, hostId });
      logger.info("Starting event creation mutation", { event, hostId });
      
      const response = await eventsApi.createEvent(event, hostId);
      console.log("API response received:", response);
      logger.info("Event API response:", response);

      if (response.error) {
        const errorMessage = response.error.message || "Failed to create event";
        console.error("API returned error:", errorMessage, response.error);
        logger.error("Event creation error:", errorMessage);
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (data) => {
      console.log("Mutation succeeded with data:", data);
      logger.info("Event creation successful:", data);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created successfully");
    },
    onError: (error: Error) => {
      const errorMessage = error?.message || "Failed to create event";
      console.error("Mutation error:", errorMessage);
      logger.error("Event mutation error:", errorMessage);
      toast.error(errorMessage || "Failed to create event. Please try again.");
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, eventData }: { eventId: string, eventData: CreateEventInput }) => {
      console.log("In updateEventMutation mutationFn with:", { eventId, eventData });
      logger.info("Starting event update mutation", { eventId, eventData });
      
      const response = await eventsApi.updateEvent(eventId, eventData);
      console.log("API update response received:", response);
      logger.info("Event update API response:", response);

      if (response.error) {
        const errorMessage = response.error.message || "Failed to update event";
        console.error("API returned error:", errorMessage, response.error);
        logger.error("Event update error:", errorMessage);
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (data) => {
      console.log("Update mutation succeeded with data:", data);
      logger.info("Event update successful:", data);
      // Invalidate both the events list and the specific event query
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", data.id] });
      toast.success("Event updated successfully");
    },
    onError: (error: Error) => {
      const errorMessage = error?.message || "Failed to update event";
      console.error("Update mutation error:", errorMessage);
      logger.error("Event update mutation error:", errorMessage);
      toast.error(errorMessage || "Failed to update event. Please try again.");
    }
  });

  return {
    createEventMutation,
    updateEventMutation
  };
}
