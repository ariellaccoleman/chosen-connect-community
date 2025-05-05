
import { LocationWithDetails } from "@/types";

// The GeoNames username is required for all API calls
// In a production environment, this should be stored in an environment variable
const GEONAMES_USERNAME = "demo";

export interface GeoNamesLocation {
  geonameId: string;
  name: string;
  countryName: string;
  adminName1: string; // State/Province/Region
  toponymName: string;
  fcl: string;
  lat: string;
  lng: string;
  population: number;
}

export interface GeoNamesSearchResponse {
  totalResultsCount: number;
  geonames: GeoNamesLocation[];
}

/**
 * Search for locations using the GeoNames API
 * @param searchTerm The search term to use
 * @returns A promise that resolves to an array of formatted locations
 */
export const searchGeoNamesLocations = async (searchTerm: string): Promise<LocationWithDetails[]> => {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return [];
  }

  try {
    // Use the GeoNames search API with JSON output
    const url = new URL("http://api.geonames.org/searchJSON");
    url.searchParams.append("q", searchTerm);
    url.searchParams.append("maxRows", "10");
    url.searchParams.append("featureClass", "P"); // Populated places only
    url.searchParams.append("username", GEONAMES_USERNAME);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error("Error fetching from GeoNames:", response.statusText);
      return [];
    }
    
    const data: GeoNamesSearchResponse = await response.json();
    
    // Map the GeoNames response to our LocationWithDetails format
    return data.geonames.map(location => ({
      id: location.geonameId,
      city: location.name,
      region: location.adminName1,
      country: location.countryName,
      full_name: `${location.name}, ${location.countryName}`,
      formatted_location: [location.name, location.adminName1, location.countryName]
        .filter(Boolean)
        .join(", ")
    }));
  } catch (error) {
    console.error("Error searching GeoNames locations:", error);
    return [];
  }
};

/**
 * Get location details by GeoName ID
 * @param geonameId The GeoName ID to fetch details for
 * @returns A promise that resolves to location details or null if not found
 */
export const getGeoNameLocationById = async (geonameId: string): Promise<LocationWithDetails | null> => {
  if (!geonameId) {
    return null;
  }

  try {
    // Use the GeoNames get API with JSON output
    const url = new URL("http://api.geonames.org/getJSON");
    url.searchParams.append("geonameId", geonameId);
    url.searchParams.append("username", GEONAMES_USERNAME);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error("Error fetching location details from GeoNames:", response.statusText);
      return null;
    }
    
    const location: GeoNamesLocation = await response.json();
    
    return {
      id: location.geonameId,
      city: location.name,
      region: location.adminName1,
      country: location.countryName,
      full_name: `${location.name}, ${location.countryName}`,
      formatted_location: [location.name, location.adminName1, location.countryName]
        .filter(Boolean)
        .join(", ")
    };
  } catch (error) {
    console.error("Error fetching GeoName location details:", error);
    return null;
  }
};
