
import { EntityType } from "@/types/entityTypes";

/**
 * Get the display name for a tag entity type
 */
export const getTagEntityTypeDisplay = (entityType: string): string => {
  // Convert known entity types to display names
  if (entityType === EntityType.PERSON) {
    return "Person";
  } else if (entityType === EntityType.ORGANIZATION) {
    return "Organization";
  } else if (entityType === EntityType.EVENT) {
    return "Event";
  }
  
  // If we don't recognize it, just capitalize the first letter
  return entityType.charAt(0).toUpperCase() + entityType.slice(1);
};

/**
 * Get a CSS color class for a tag based on entity type
 */
export const getTagColorByEntityType = (entityType: string | null): string => {
  if (!entityType) return "bg-gray-500";
  
  // Convert known entity types to color classes
  if (entityType === EntityType.PERSON) {
    return "bg-blue-500";
  } else if (entityType === EntityType.ORGANIZATION) {
    return "bg-green-500";
  } else if (entityType === EntityType.EVENT) {
    return "bg-purple-500";
  }
  
  // Default color for unknown types
  return "bg-gray-500";
};
