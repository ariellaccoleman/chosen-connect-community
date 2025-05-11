
import { TagAssignment } from "@/utils/tags";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";

/**
 * Assign a tag to an entity
 */
export const assignTag = async (
  tagId: string,
  entityId: string,
  entityType: "person" | "organization"
): Promise<ApiResponse<TagAssignment>> => {
  return apiClient.query(async (client) => {
    // First, create the tag assignment
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
    
    // Then, update the tag_entity_types table if needed
    // Check if this entity type is already registered for this tag
    const { data: existingType, error: typeCheckError } = await client
      .from('tag_entity_types')
      .select('id')
      .eq('tag_id', tagId)
      .eq('entity_type', entityType)
      .maybeSingle();
    
    if (typeCheckError) throw typeCheckError;
    
    // If this tag doesn't have this entity type yet, add it
    if (!existingType) {
      const { error: insertError } = await client
        .from('tag_entity_types')
        .insert({
          tag_id: tagId,
          entity_type: entityType
        });
      
      if (insertError) throw insertError;
    }
    
    return createSuccessResponse(data);
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
