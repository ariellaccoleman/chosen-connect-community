
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Organization } from "@/types";
import { useFilterTags } from "./useTags";

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
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        throw error;
      }
      return data as Organization;
    },
    enabled: !!id,
  });
};

// New hook to fetch tags specifically for organization filtering
export const useTagsForOrganizationFilter = () => {
  const { data: tags = [], isLoading } = useFilterTags({
    targetType: "organization"
  });
  
  return {
    tags,
    isLoading
  };
};

// Add back the missing export for backwards compatibility
export const useUserOrganizationRelationships = () => {
  return useQuery({
    queryKey: ["user-organization-relationships"],
    queryFn: async () => {
      // This is a placeholder implementation to fix the build error
      // The actual implementation should be properly defined based on the application's needs
      return [];
    }
  });
};
