
import { TagAssignment } from "@/utils/tags";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";
import { EntityType, isValidEntityType } from "@/types/entityTypes";

/**
 * Get tags assigned to a specific entity
 */
export const getEntityTags = async (
  entityId: string,
  entityType: EntityType | string
): Promise<ApiResponse<TagAssignment[]>> => {
  // Validate entity type
  if (!isValidEntityType(entityType)) {
    console.error(`Invalid entity type: ${entityType}`);
    return createSuccessResponse([]); // Return empty array for invalid types
  }

  return apiClient.query(async (client) => {
    const { data, error } = await client
      .from('tag_assignments')
      .select(`
        *,
        tag:tags(*)
      `)
      .eq('target_id', entityId)
      .eq('target_type', entityType);
    
    if (error) throw error;
    
    // Ensure the response matches the TagAssignment type
    const formattedAssignments = (data || []).map(assignment => ({
      ...assignment,
      updated_at: assignment.updated_at || assignment.created_at
    }));
    
    return createSuccessResponse(formattedAssignments);
  });
};

/**
 * Get entities that have a specific tag assigned
 */
export const getEntitiesWithTag = async (
  tagId: string,
  entityType?: EntityType | string
): Promise<ApiResponse<TagAssignment[]>> => {
  try {
    if (!tagId) return createSuccessResponse([]);
    
    return apiClient.query(async (client) => {
      let query = client
        .from('tag_assignments')
        .select(`
          *,
          tag:tags(*)
        `)
        .eq('tag_id', tagId);
        
      // Add entity type filter if provided
      if (entityType && isValidEntityType(entityType)) {
        query = query.eq('target_type', entityType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return createSuccessResponse(data || []);
    });
  } catch (error) {
    console.error("Error fetching entities with tag:", error);
    return createSuccessResponse([]);
  }
};
