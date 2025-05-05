
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
        setLocations(results);
      } catch (err) {
        console.error("Error fetching locations:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch locations"));
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchLocations, 300); // Add debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return { data: locations, isLoading, error };
};
