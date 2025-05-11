
import { TagAssignment } from "@/utils/tags";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";

/**
 * Get tags assigned to a specific entity
 */
export const getEntityTags = async (
  entityId: string,
  entityType: "person" | "organization"
): Promise<ApiResponse<TagAssignment[]>> => {
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
