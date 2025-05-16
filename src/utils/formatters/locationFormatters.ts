
import { Location, LocationWithDetails } from "@/types/location";

// Format location object to a readable string
export const formatLocation = (location: Location | null | undefined): string => {
  if (!location) return "";
  
  return [location.city, location.region, location.country]
    .filter(Boolean)
    .join(", ");
};

// Helper function to create LocationWithDetails
export const formatLocationWithDetails = (locationData: any): LocationWithDetails | undefined => {
  if (!locationData) return undefined;
  
  return {
    id: locationData.id || '',
    city: locationData.city || '',
    region: locationData.region || '',
    country: locationData.country || '',
    full_name: locationData.full_name || '',
    // Remove created_at as it's not part of LocationWithDetails
    updated_at: locationData.updated_at,
    formatted_location: formatLocation({
      city: locationData.city || '',
      region: locationData.region || '',
      country: locationData.country || '',
      id: locationData.id || '',
      full_name: locationData.full_name
    })
  };
};
