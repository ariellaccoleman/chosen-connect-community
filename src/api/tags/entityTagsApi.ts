
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
