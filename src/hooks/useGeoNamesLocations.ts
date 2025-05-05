
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
        setLocations(results); // results is guaranteed to be an array from searchGeoNamesLocations
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

  return { 
    data: locations, // locations is always initialized as an empty array
    isLoading, 
    error 
  };
};
