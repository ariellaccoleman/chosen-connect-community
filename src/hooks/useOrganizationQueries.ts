
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Organization, OrganizationWithLocation } from "@/types";
import { useFilterTags } from "./useTags";
import { formatOrganizationRelationships } from "@/utils/formatters/organizationFormatters";
import { formatLocationWithDetails } from "@/utils/formatters/locationFormatters";
import { EntityType } from "@/types/entityTypes";
import { organizationsApi } from "@/api";

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
  return useQuery({
    queryKey: ["organization", id],
    queryFn: async () => {
      if (!id) return null;
      
      const response = await organizationsApi.getOrganizationById(id);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    enabled: !!id,
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
        throw error;
      }
      
      // Format the organization relationships to include formatted location
      return formatOrganizationRelationships(data || []);
    },
    enabled: !!userId
  });
};
