
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
        // For search functionality, handle terms with or without commas
        if (searchTerm.includes(',')) {
          // For comma-separated searches, split and search the parts individually
          const parts = searchTerm.split(',').map(part => part.trim()).filter(Boolean);
          
          if (parts.length >= 1) {
            // Search for the first part in city, and full_name
            const firstPart = parts[0].replace(/[%,_]/g, '');
            query = query.ilike('full_name', `%${firstPart}%`);
            
            // If there are additional parts, narrow search based on those parts as well
            if (parts.length >= 2) {
              // For the second part, typically a state/region, match it in the full_name
              const combinedSearch = parts.join(', ').replace(/[%,_]/g, '');
              query = query.ilike('full_name', `%${combinedSearch}%`);
            }
          }
        } else {
          // Clean the search term to avoid SQL injection and escape special characters
          const cleanedSearchTerm = searchTerm.replace(/[%,_]/g, '');
          
          if (cleanedSearchTerm) {
            // Use the cleaned search term in the query
            query = query.or(`city.ilike.%${cleanedSearchTerm}%,region.ilike.%${cleanedSearchTerm}%,country.ilike.%${cleanedSearchTerm}%,full_name.ilike.%${cleanedSearchTerm}%`);
          }
        }
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
