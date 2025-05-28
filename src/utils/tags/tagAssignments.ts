
import { TagAssignment } from "./types";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { toast } from "sonner";
import { tagAssignmentApi } from "@/api/tags/factory/tagApiFactory";

/**
 * Assign a tag to an entity
 * Entity type associations are now handled automatically by SQL triggers
 */
export const assignTag = async (
  tagId: string,
  entityId: string,
  entityType: EntityType | string
): Promise<boolean> => {
  try {
    // Validate entity type
    if (!isValidEntityType(entityType)) {
      logger.error(`Invalid entity type: ${entityType}`);
      return false;
    }
    
    logger.debug(`Assigning tag ${tagId} to ${entityType} ${entityId}`);

    // Use the new tag assignment API with wrapped response
    const response = await tagAssignmentApi.create(tagId, entityId, entityType as EntityType);
    
    if (response.error) {
      logger.error("Error assigning tag:", response.error);
      return false;
    }
    
    if (response.data) {
      logger.info(`Tag ${tagId} assigned to ${entityType} ${entityId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error("Error in assignTag:", error);
    return false;
  }
};

/**
 * Assign multiple tags to an entity
 */
export const assignTags = async (
  tagIds: string[],
  entityId: string,
  entityType: EntityType | string
): Promise<boolean> => {
  if (!tagIds.length) return true;
  
  try {
    const results = await Promise.all(
      tagIds.map(tagId => assignTag(tagId, entityId, entityType))
    );
    
    // Return true only if all assignments succeeded
    return results.every(Boolean);
  } catch (error) {
    logger.error("Error in assignTags:", error);
    return false;
  }
};

/**
 * Remove a tag assignment
 * Entity type cleanup is now handled automatically by SQL triggers
 */
export const removeTagAssignment = async (assignmentId: string): Promise<boolean> => {
  try {
    // Use the new tag assignment API with wrapped response
    const response = await tagAssignmentApi.delete(assignmentId);

    if (response.error) {
      logger.error("Error removing tag assignment:", response.error);
      toast.error("Failed to remove tag");
      return false;
    }
    
    if (response.data) {
      logger.info(`Tag assignment ${assignmentId} removed`);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error("Error in removeTagAssignment:", error);
    return false;
  }
};

/**
 * Get tag assignments for an entity
 */
export const fetchEntityTags = async (
  entityId: string,
  entityType: EntityType | string
): Promise<TagAssignment[]> => {
  try {
    // Validate entity type
    if (!isValidEntityType(entityType)) {
      logger.error(`Invalid entity type: ${entityType}`);
      return [];
    }

    // Use the new tag assignment API with wrapped response
    const response = await tagAssignmentApi.getForEntity(entityId, entityType as EntityType);

    if (response.error) {
      logger.error("Error fetching entity tags:", response.error);
      return [];
    }

    return response.data || [];
  } catch (error) {
    logger.error("Error in fetchEntityTags:", error);
    return [];
  }
};

/**
 * Get entities that have a specific tag assigned
 */
export const fetchEntitiesWithTag = async (
  tagId: string,
  entityType?: EntityType | string
): Promise<TagAssignment[]> => {
  try {
    if (!tagId) return [];

    // Validate entity type if provided
    if (entityType && !isValidEntityType(entityType)) {
      logger.error(`Invalid entity type: ${entityType}`);
      return [];
    }

    // Use the new tag assignment API with wrapped response
    const response = await tagAssignmentApi.getEntitiesByTagId(tagId, entityType as EntityType);

    if (response.error) {
      logger.error("Error fetching entities with tag:", response.error);
      return [];
    }

    return response.data || [];
  } catch (error) {
    logger.error("Error in fetchEntitiesWithTag:", error);
    return [];
  }
};
