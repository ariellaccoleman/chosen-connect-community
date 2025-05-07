
import { Location } from "@/types";

// Format location object to a readable string
export const formatLocation = (location: Location | null | undefined): string => {
  if (!location) return "";
  
  return [location.city, location.region, location.country]
    .filter(Boolean)
    .join(", ");
};
