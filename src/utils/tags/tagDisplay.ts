
import { Tag } from "./types";
import { getTagEntityTypes } from "./tagEntityTypes";

/**
 * Get a formatted display name for a tag based on its entity usage
 */
export const getTagDisplayName = async (tag: Tag, currentEntityType: "person" | "organization"): Promise<string> => {
  // Always return just the tag name without entity type information
  return tag.name;
};
