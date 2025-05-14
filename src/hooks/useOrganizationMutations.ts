
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationCrudApi, organizationRelationshipsApi } from "@/api";
import { ProfileOrganizationRelationship, OrganizationFormValues, Organization } from "@/types";
import { toast } from "@/components/ui/sonner";
import { logger } from "@/utils/logger";
import { ApiResponse } from "@/api/core/errorHandler";

/**
 * Hook to create a new organization with all necessary relationships
 */
export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      data, 
      userId 
    }: { 
      data: { 
        name: string; 
        description?: string; 
        website_url?: string; 
      }; 
      userId: string 
    }) => {
      logger.info("Creating organization:", data);
      return organizationCrudApi.createOrganization(data, userId);
    },
    onSuccess: (response: ApiResponse<Organization>) => {
      const organizationId = response.data?.id;
      logger.info("Successfully created organization:", organizationId);
      
      // Invalidate organizations queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      
      // Show success message
      toast.success("Organization created successfully!");
      
      return organizationId;
    },
    onError: (error) => {
      logger.error("Failed to create organization:", error);
      toast.error("Failed to create organization. Please try again.");
    }
  });
};

/**
 * Hook to add an organization relationship
 */
export const useAddOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (relationship: Partial<ProfileOrganizationRelationship>) => 
      organizationRelationshipsApi.addOrganizationRelationship(relationship),
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
      organizationRelationshipsApi.updateOrganizationRelationship(id, data),
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
    mutationFn: (id: string) => organizationRelationshipsApi.deleteOrganizationRelationship(id),
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

/**
 * Hook to update an organization's details
 */
export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orgId, data }: { 
      orgId: string; 
      data: OrganizationFormValues;
    }) => {
      logger.info("Updating organization:", { orgId, data });
      
      return organizationCrudApi.updateOrganization(orgId, {
        name: data.name,
        description: data.description,
        website_url: data.website_url,
        logo_url: data.logo_url,
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: (_, variables) => {
      logger.info("Successfully updated organization:", variables.orgId);
      // Invalidate both organization lists and the specific organization
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization", variables.orgId] });
    },
    onError: (error) => {
      logger.error("Error updating organization:", error);
    }
  });
};
