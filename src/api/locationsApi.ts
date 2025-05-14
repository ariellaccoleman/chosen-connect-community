
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
          // For comma-separated searches, use the first part to search
          // but match the ENTIRE pattern in full_name to handle region matching
          const firstPart = searchTerm.split(',')[0].trim().replace(/[%_]/g, '');
          const cleanedFullTerm = searchTerm.replace(/[%_]/g, '');
          
          // This approach allows partial matches on the second part (after comma)
          // It will match "Washington, D" against "Washington, District of Columbia"
          query = query.ilike('full_name', `%${firstPart}%`)
                       .ilike('full_name', `%${cleanedFullTerm}%`);
        } else {
          // Clean the search term to avoid SQL injection and escape special characters
          const cleanedSearchTerm = searchTerm.replace(/[%,_]/g, '');
          
          if (cleanedSearchTerm) {
            // Use the cleaned search term in the query
            query = query.or(`city.ilike.%${cleanedSearchTerm}%,region.ilike.%${cleanedSearchTerm}%,country.ilike.%${cleanedSearchTerm}%,full_name.ilike.%${cleanedSearchTerm}%`);
          }
        }
      }
      
      // Order by population (stored in geoname_id field) by default for more relevant results
      const { data, error } = await query.order('geoname_id', { ascending: false });
      
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
