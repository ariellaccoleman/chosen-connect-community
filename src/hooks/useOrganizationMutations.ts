
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationsApi } from "@/api";
import { ProfileOrganizationRelationship } from "@/types";
import { toast } from "@/components/ui/sonner";
import { logger } from "@/utils/logger";

/**
 * Hook to add an organization relationship
 */
export const useAddOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (relationship: Partial<ProfileOrganizationRelationship>) => 
      organizationsApi.addOrganizationRelationship(relationship),
    onSuccess: (_, variables) => {
      logger.info("Successfully added organization relationship", variables);
      queryClient.invalidateQueries({ queryKey: ["organization-relationships", variables.profile_id] });
      toast.success("Successfully added organization connection");
    },
    onError: (error) => {
      logger.error("Failed to add organization relationship:", error);
      toast.error("Failed to add organization connection");
    }
  });
};

/**
 * Hook to update an organization relationship
 */
export const useUpdateOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProfileOrganizationRelationship> }) => 
      organizationsApi.updateOrganizationRelationship(id, data),
    onSuccess: (_, variables) => {
      logger.info("Successfully updated organization relationship", variables);
      // Since we don't know the profile_id here, invalidate all relationship queries
      queryClient.invalidateQueries({ queryKey: ["organization-relationships"] });
      toast.success("Successfully updated organization connection");
    },
    onError: (error) => {
      logger.error("Failed to update organization relationship:", error);
      toast.error("Failed to update organization connection");
    }
  });
};

/**
 * Hook to delete an organization relationship
 */
export const useDeleteOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => organizationsApi.deleteOrganizationRelationship(id),
    onSuccess: () => {
      logger.info("Successfully deleted organization relationship");
      // Since we don't know the profile_id here, invalidate all relationship queries
      queryClient.invalidateQueries({ queryKey: ["organization-relationships"] });
      toast.success("Organization connection removed successfully");
    },
    onError: (error) => {
      logger.error("Failed to delete organization relationship:", error);
      toast.error("Failed to remove organization connection");
    }
  });
};
