
import { createApiFactory } from '../core/factory/apiFactory';
import { LocationWithDetails } from '@/types/location';
import { apiClient } from '../core/apiClient';
import { ApiResponse, createSuccessResponse } from '../core/errorHandler';

/**
 * Create API operations for locations using the factory pattern
 */
export const locationsApi = createApiFactory<LocationWithDetails, string, Partial<LocationWithDetails>, Partial<LocationWithDetails>, 'locations'>(
  {
    tableName: 'locations',
    entityName: 'location',
    defaultOrderBy: 'geoname_id',
    defaultSelect: '*',
    
    transformResponse: (data) => {
      // Format the location with a consistent formatted_location field
      const location = { ...data };
      
      // Create formatted location string if it doesn't exist
      if (!location.formatted_location) {
        const city = location.city || '';
        const region = location.region || '';
        const country = location.country || '';
        
        location.formatted_location = [city, region, country]
          .filter(Boolean)
          .join(', ');
      }
      
      return location;
    },
    
    useMutationOperations: true,
    useBatchOperations: false
  }
);

/**
 * Reset locations API with authenticated client
 */
export const resetApi = (client?: any) => {
  const newApi = createApiFactory<LocationWithDetails, string, Partial<LocationWithDetails>, Partial<LocationWithDetails>, 'locations'>(
    {
      tableName: 'locations',
      entityName: 'location',
      defaultOrderBy: 'geoname_id',
      defaultSelect: '*',
      
      transformResponse: (data) => {
        // Format the location with a consistent formatted_location field
        const location = { ...data };
        
        // Create formatted location string if it doesn't exist
        if (!location.formatted_location) {
          const city = location.city || '';
          const region = location.region || '';
          const country = location.country || '';
          
          location.formatted_location = [city, region, country]
            .filter(Boolean)
            .join(', ');
        }
        
        return location;
      },
      
      useMutationOperations: true,
      useBatchOperations: false
    }, client
  );

  return {
    getAll: newApi.getAll,
    getById: newApi.getById,
    getByIds: newApi.getByIds,
    create: newApi.create,
    update: newApi.update,
    delete: newApi.delete,
    searchLocations: async (
      searchTerm: string = '', 
      specificId?: string
    ): Promise<ApiResponse<LocationWithDetails[]>> => {
      return apiClient.query(async (clientInstance) => {
        const activeClient = client || clientInstance;
        let query = activeClient.from('locations').select('*');
          
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
        
        // Apply transformResponse to each location
        const transformResponse = (location: LocationWithDetails) => {
          // Format the location with a consistent formatted_location field
          const transformedLocation = { ...location };
          
          // Create formatted location string if it doesn't exist
          if (!transformedLocation.formatted_location) {
            const city = transformedLocation.city || '';
            const region = transformedLocation.region || '';
            const country = transformedLocation.country || '';
            
            transformedLocation.formatted_location = [city, region, country]
              .filter(Boolean)
              .join(', ');
          }
          
          return transformedLocation;
        };
        
        const transformedLocations = (data || []).map(transformResponse);
        
        return createSuccessResponse(transformedLocations);
      });
    }
  };
};

// Export individual operations for direct usage
export const {
  getAll: getAllLocations,
  getById: getLocationById,
  getByIds: getLocationsByIds,
  create: createLocation,
  update: updateLocation,
  delete: deleteLocation
} = locationsApi;

/**
 * Search locations by search term
 * This is a specialized operation that doesn't fit well into the factory pattern
 */
export const searchLocations = async (
  searchTerm: string = '', 
  specificId?: string
): Promise<ApiResponse<LocationWithDetails[]>> => {
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
    
    // Apply transformResponse to each location
    const transformResponse = (location: LocationWithDetails) => {
      // Format the location with a consistent formatted_location field
      const transformedLocation = { ...location };
      
      // Create formatted location string if it doesn't exist
      if (!transformedLocation.formatted_location) {
        const city = transformedLocation.city || '';
        const region = transformedLocation.region || '';
        const country = transformedLocation.country || '';
        
        transformedLocation.formatted_location = [city, region, country]
          .filter(Boolean)
          .join(', ');
      }
      
      return transformedLocation;
    };
    
    const transformedLocations = (data || []).map(transformResponse);
    
    return createSuccessResponse(transformedLocations);
  });
};
