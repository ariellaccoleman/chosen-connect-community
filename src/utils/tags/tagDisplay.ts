import { Tag } from "./types";
import { getTagEntityTypes } from "./tagEntityTypes";

/**
 * Get a formatted display name for a tag based on its entity usage
 */
export const getTagDisplayName = async (tag: Tag, currentEntityType: "person" | "organization"): Promise<string> => {
  // Get entity types for this tag from the tag_entity_types table
  const entityTypes = await getTagEntityTypes(tag.id);
  
  if (!entityTypes || entityTypes.length === 0) {
    return tag.name;
  }
  
  // If the tag has been used with the current entity type, just show the name
  if (entityTypes.includes(currentEntityType)) {
    return tag.name;
  }
  
  // Otherwise, show the name with the entity types it has been used with
  const otherTypes = entityTypes
    .map(type => type === "person" ? "People" : "Organizations")
    .join(", ");
  
  return `${tag.name} (${otherTypes})`;
};
