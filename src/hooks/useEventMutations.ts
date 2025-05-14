
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

  return {
    createEventMutation
  };
}
