
import { useQuery } from '@tanstack/react-query';
import { locationsApi } from '@/api';
import { LocationWithDetails } from '@/types';
import { showErrorToast } from '@/api/core/errorHandler';

/**
 * Hook to fetch a single location by ID
 * @param locationId - The ID of the location to fetch
 */
export const useLocationById = (locationId: string | undefined) => {
  return useQuery({
    queryKey: ['location', locationId],
    queryFn: async (): Promise<LocationWithDetails | null> => {
      // Don't fetch if no ID is provided
      if (!locationId) return null;
      
      const response = await locationsApi.getById(locationId);
      
      if (response.error) {
        console.error('Location fetch error:', response.error);
        showErrorToast(response.error);
        return null;
      }
      
      return response.data || null;
    },
    // Don't run the query if locationId is undefined
    enabled: !!locationId,
  });
};
