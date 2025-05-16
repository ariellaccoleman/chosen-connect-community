
import { LocationWithDetails } from '@/types/location';
import { createQueryHooks } from '../core/factory/queryHookFactory';
import { locationsApi, searchLocations } from '@/api/locations';
import { useQuery } from '@tanstack/react-query';

// Create standard CRUD hooks for locations using the factory
const {
  useList: useLocationList,
  useById: useLocationById,
  useByIds: useLocationsByIds,
  useCreate: useCreateLocation,
  useUpdate: useUpdateLocation,
  useDelete: useDeleteLocation
} = createQueryHooks<LocationWithDetails>(
  { 
    name: 'location',
    pluralName: 'locations',
    displayName: 'Location',
    pluralDisplayName: 'Locations'
  },
  locationsApi
);

/**
 * Hook for searching locations
 */
const useLocationSearch = (searchTerm?: string, specificId?: string) => {
  return useQuery({
    queryKey: ['locationSearch', searchTerm, specificId],
    queryFn: () => searchLocations(searchTerm, specificId),
    enabled: !!searchTerm || !!specificId
  });
};

export {
  useLocationList,
  useLocationById,
  useLocationsByIds,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
  useLocationSearch
};
