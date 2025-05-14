import { useQuery } from "@tanstack/react-query";
import { organizationsApi } from "@/api";
import { useTagQueries } from "./useTagQueries";

export function useOrganizationQueries() {
  const { useFilterTags } = useTagQueries();
  
  const useOrganizations = () => {
    return useQuery({
      queryKey: ["organizations"],
      queryFn: organizationsApi.getOrganizations,
    });
  };

  return {
    useOrganizations,
    useFilterTags
  };
}
