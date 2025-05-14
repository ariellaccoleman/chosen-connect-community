import { TagAssignment } from "@/utils/tags";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";
import { updateTagEntityType } from "./tagEntityTypesApi";
import { EntityType, isValidEntityType } from "@/types/entityTypes";

/**
 * Assign a tag to an entity
 */
export const assignTag = async (
  tagId: string,
  entityId: string,
  entityType: EntityType | string
): Promise<ApiResponse<TagAssignment>> => {
  // Validate entity type
  if (!isValidEntityType(entityType)) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  return apiClient.query(async (client) => {
    try {
      // Step 1: Update tag_entity_types to ensure this tag is associated with this entity type
      const entityTypeResponse = await updateTagEntityType(tagId, entityType);
      
      if (entityTypeResponse.status !== 'success') {
        throw new Error(`Failed to update tag entity type: ${entityTypeResponse.error?.message}`);
      }
      
      // Step 2: Create the tag assignment
      const { data, error } = await client
        .from('tag_assignments')
        .insert({
          tag_id: tagId,
          target_id: entityId,
          target_type: entityType
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`Successfully assigned tag ${tagId} to ${entityType} ${entityId}`);
      return createSuccessResponse(data);
    } catch (error) {
      console.error("Error in assignTag:", error);
      throw error;
    }
  });
};

/**
 * Remove a tag assignment
 */
export const removeTagAssignment = async (assignmentId: string): Promise<ApiResponse<boolean>> => {
  return apiClient.query(async (client) => {
    // First get the assignment details to identify tag_id and entity_type
    const { data: assignment, error: getError } = await client
      .from('tag_assignments')
      .select('tag_id, target_type')
      .eq('id', assignmentId)
      .maybeSingle();
    
    if (getError) throw getError;
    
    // Delete the assignment
    const { error: deleteError } = await client
      .from('tag_assignments')
      .delete()
      .eq('id', assignmentId);
    
    if (deleteError) throw deleteError;
    
    // If we found the assignment details, check if we need to update tag_entity_types
    if (assignment) {
      const tagId = assignment.tag_id;
      const entityType = assignment.target_type;
      
      // Check if this tag has any other assignments with this entity type
      const { data: otherAssignments, error: checkError } = await client
        .from('tag_assignments')
        .select('id')
        .eq('tag_id', tagId)
        .eq('target_type', entityType)
        .neq('id', assignmentId)
        .limit(1);
      
      if (checkError) throw checkError;
      
      // If no other assignments with this type, remove from tag_entity_types
      if (!otherAssignments || otherAssignments.length === 0) {
        const { error: removeError } = await client
          .from('tag_entity_types')
          .delete()
          .eq('tag_id', tagId)
          .eq('entity_type', entityType);
        
        if (removeError) throw removeError;
      }
    }
    
    return createSuccessResponse(true);
  });
};
