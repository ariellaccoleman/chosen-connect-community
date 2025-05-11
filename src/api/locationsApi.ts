import { LocationWithDetails } from "@/types";
import { apiClient } from "./core/apiClient";
import { ApiResponse, createSuccessResponse } from "./core/errorHandler";

/**
 * API module for location-related operations
 */
export const locationsApi = {
  /**
   * Get locations with optional search
   */
  async getLocations(
    searchTerm: string = '', 
    specificId?: string
  ): Promise<ApiResponse<LocationWithDetails[]>> {
    return apiClient.query(async (client) => {
      let query = client.from('locations').select('*');
      
      if (specificId) {
        // If a specific ID is provided, fetch just that location
        query = query.eq('id', specificId);
      } else if (searchTerm) {
        // Otherwise use search term if provided
        query = query.or(`city.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('full_name');
      
      if (error) throw error;
      
      // Map locations to include the formatted_location field
      const formattedLocations = (data || []).map(location => {
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
      
      return createSuccessResponse(formattedLocations);
    });
  }
};
