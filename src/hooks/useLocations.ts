
import { useQuery } from '@tanstack/react-query';
import { locationsApi } from '@/api';
import { LocationWithDetails } from '@/types';
import { showErrorToast } from '@/api/core/errorHandler';

export const useLocations = (searchTerm: string = '', specificId?: string) => {
  return useQuery({
    queryKey: ['locations', searchTerm, specificId],
    queryFn: async (): Promise<LocationWithDetails[]> => {
      const response = await locationsApi.getLocations(searchTerm, specificId);
      
      if (response.error) {
        console.error('Location search error:', response.error);
        showErrorToast(response.error);
        return [];
      }
      
      return response.data || [];
    },
    // Always return empty array as fallback instead of undefined
    placeholderData: [],
  });
};
