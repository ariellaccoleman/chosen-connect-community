
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "@/api";
import { CreateEventInput } from "@/types";
import { showErrorToast } from "@/api/core/errorHandler";
import { toast } from "@/components/ui/sonner";

export function useEventMutations() {
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: async ({ event, hostId }: { event: CreateEventInput, hostId: string }) => {
      const response = await eventsApi.createEvent(event, hostId);

      if (response.error) {
        showErrorToast(response.error);
        throw response.error;
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created successfully");
    }
  });

  return {
    createEventMutation
  };
}
