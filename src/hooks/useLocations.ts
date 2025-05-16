
/**
 * @deprecated This module is maintained for backward compatibility only.
 * Please update your imports to use:
 * import { useLocationSearch } from '@/hooks/locations';
 */

import { useLocationSearch } from './locations';
import { useState } from 'react';

/**
 * Hook for searching locations and managing the local search state
 * @deprecated Please use useLocationSearch from '@/hooks/locations' instead
 */
export const useLocations = (initialSearch: string = '') => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const { data: searchData, isLoading, error } = useLocationSearch(searchTerm);

  return {
    locations: searchData?.data || [],
    isLoading,
    error,
    searchTerm,
    setSearchTerm
  };
};
