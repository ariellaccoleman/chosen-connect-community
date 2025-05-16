
import { useLocationSearch } from './locations';
import { useState } from 'react';

/**
 * Hook for searching locations and managing the local search state
 * This is maintained for backward compatibility
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
