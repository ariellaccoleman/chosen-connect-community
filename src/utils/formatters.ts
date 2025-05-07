
import { Location } from "@/types";

// Format location object to a readable string
export const formatLocation = (location: Location | null | undefined): string => {
  if (!location) return "";
  
  return [location.city, location.region, location.country]
    .filter(Boolean)
    .join(", ");
};

// Format website URL to ensure it has https://
export const formatWebsiteUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
};
