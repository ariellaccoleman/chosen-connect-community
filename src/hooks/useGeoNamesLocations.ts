
import { useState, useEffect } from "react";
import { LocationWithDetails } from "@/types";
import { searchGeoNamesLocations } from "@/utils/geoNamesUtils";

export const useGeoNamesLocations = (searchTerm: string = "") => {
  const [locations, setLocations] = useState<LocationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setLocations([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await searchGeoNamesLocations(searchTerm);
        setLocations(results || []); // Ensure we always set an array
      } catch (err) {
        console.error("Error fetching locations:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch locations"));
        setLocations([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchLocations, 300); // Add debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Ensure we always return a valid array, never undefined
  return { 
    data: Array.isArray(locations) ? locations : [], 
    isLoading, 
    error 
  };
};
