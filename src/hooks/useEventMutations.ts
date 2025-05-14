
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "@/api";
import { CreateEventInput } from "@/types";
import { showErrorToast } from "@/api/core/errorHandler";
import { toast } from "@/components/ui/use-toast";
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
        console.error("API returned error:", response.error);
        logger.error("Event creation error:", response.error);
        showErrorToast(response.error);
        throw response.error;
      }

      return response.data;
    },
    onSuccess: (data) => {
      console.log("Mutation succeeded with data:", data);
      logger.info("Event creation successful:", data);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created successfully");
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      logger.error("Event mutation error:", error);
      toast.error("Failed to create event. Please try again.");
    }
  });

  return {
    createEventMutation
  };
}
