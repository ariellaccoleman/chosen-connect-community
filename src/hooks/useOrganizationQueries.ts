import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Organization, OrganizationWithLocation } from "@/types";
import { useFilterTags } from "./useTags";
import { formatOrganizationRelationships } from "@/utils/formatters/organizationFormatters";
import { formatLocationWithDetails } from "@/utils/formatters/locationFormatters";
import { EntityType } from "@/types/entityTypes";
import { organizationsApi } from "@/api";
import { logger } from "@/utils/logger";

export const useOrganizations = () => {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*");
      if (error) {
        throw error;
      }
      return data as Organization[];
    },
  });
};

export const useOrganization = (id: string | undefined) => {
  logger.info(`useOrganization hook called with ID: ${id || 'undefined'}`);
  
  return useQuery({
    queryKey: ["organization", id],
    queryFn: async () => {
      logger.info(`useOrganization queryFn executing for ID: ${id}`);
      
      if (!id) {
        logger.warn("useOrganization called with undefined ID");
        return null;
      }
      
      try {
        // Explicitly log the ID before making the API call
        logger.info(`About to call organizationsApi.getOrganizationById with ID: "${id}"`);
        
        const response = await organizationsApi.getOrganizationById(id);
        
        logger.info(`API response received for ID ${id}:`, { 
          success: !response.error,
          hasData: !!response.data,
          error: response.error
        });
        
        if (response.error) {
          logger.error(`Error in useOrganization hook for ID ${id}:`, response.error);
          throw response.error;
        }
        
        if (!response.data) {
          logger.warn(`Organization not found for ID: ${id}`);
        } else {
          logger.info(`Organization found for ID ${id}:`, { name: response.data.name });
        }
        
        return response.data;
      } catch (error) {
        logger.error(`Exception in useOrganization hook for ID ${id}:`, error);
        throw error;
      }
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
    retry: 1, // Limit retries to avoid excessive API calls
  });
};

// New hook to fetch tags specifically for organization filtering
export const useTagsForOrganizationFilter = () => {
  const { data: tags = [], isLoading } = useFilterTags({
    targetType: EntityType.ORGANIZATION
  });
  
  return {
    tags,
    isLoading
  };
};

// Proper implementation for the useUserOrganizationRelationships function
export const useUserOrganizationRelationships = (userId?: string) => {
  return useQuery({
    queryKey: ["user-organization-relationships", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      logger.info(`Fetching organization relationships for user: ${userId}`);
      
      const { data, error } = await supabase
        .from("org_relationships")
        .select(`
          *,
          organization:organizations(
            *,
            location:locations(*)
          )
        `)
        .eq("profile_id", userId);
        
      if (error) {
        logger.error(`Error fetching relationships for user ${userId}:`, error);
        throw error;
      }
      
      logger.info(`Found ${data?.length || 0} organization relationships for user ${userId}`);
      
      // Format the organization relationships to include formatted location
      return formatOrganizationRelationships(data || []);
    },
    enabled: !!userId
  });
};
