import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LocationWithDetails } from '@/types';

export const useLocations = (searchTerm: string = '') => {
  return useQuery({
    queryKey: ['locations', searchTerm],
    queryFn: async (): Promise<LocationWithDetails[]> => {
      try {
        let query = supabase.from('locations').select('*');
        
        if (searchTerm) {
          query = query.or(`city.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
        }
        
        const { data, error } = await query.order('full_name');
        
        if (error) {
          console.error('Error fetching locations:', error);
          return []; // Return empty array on error
        }
        
        // Ensure we always have an array, even if data is null
        const locations = data || [];
        
        // Map locations to include the formatted_location field, making sure no field is undefined
        return locations.map(location => {
          // If there's a full_name, prefer that
          if (location.full_name) {
            return {
              ...location,
              formatted_location: location.full_name
            };
          }
          
          // Otherwise construct from components
          const city = location.city || '';
          const region = location.region || '';
          const country = location.country || '';
          
          const formatted = [city, region, country]
            .filter(Boolean)
            .join(', ');
          
          return {
            ...location,
            formatted_location: formatted || 'Unknown location'
          };
        });
      } catch (error) {
        console.error('Unexpected error in useLocations:', error);
        return []; // Return empty array on any error
      }
    },
    // Always return empty array as fallback instead of undefined
    placeholderData: [],
  });
};
