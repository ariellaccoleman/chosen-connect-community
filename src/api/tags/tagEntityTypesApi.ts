
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";

/**
 * Associate a tag with an entity type
 * This handles the case where the association already exists
 */
export const updateTagEntityType = async (
  tagId: string,
  entityType: string
): Promise<ApiResponse<boolean>> => {
  return apiClient.query(async (client) => {
    // Check if this entity type already exists for this tag
    const { data: existingType, error: checkError } = await client
      .from('tag_entity_types')
      .select('id')
      .eq('tag_id', tagId)
      .eq('entity_type', entityType)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    // If entity type doesn't exist for this tag, add it
    if (!existingType) {
      const { error: insertError } = await client
        .from('tag_entity_types')
        .insert({
          tag_id: tagId,
          entity_type: entityType
        });
        
      if (insertError) throw insertError;
      
      console.log(`Added entity type ${entityType} to tag ${tagId}`);
    } else {
      console.log(`Entity type ${entityType} already exists for tag ${tagId}`);
    }
    
    return createSuccessResponse(true);
  });
};

/**
 * Remove a tag entity type if no more assignments with that type exist
 */
export const removeTagEntityTypeIfUnused = async (
  tagId: string,
  entityType: string
): Promise<ApiResponse<boolean>> => {
  return apiClient.query(async (client) => {
    // Check if there are any assignments with this tag and entity type
    const { data: assignments, error: checkError } = await client
      .from('tag_assignments')
      .select('id')
      .eq('tag_id', tagId)
      .eq('target_type', entityType)
      .limit(1);
      
    if (checkError) throw checkError;
    
    // If no assignments found, remove the entity type for this tag
    if (!assignments || assignments.length === 0) {
      const { error: removeError } = await client
        .from('tag_entity_types')
        .delete()
        .eq('tag_id', tagId)
        .eq('entity_type', entityType);
        
      if (removeError) throw removeError;
      
      console.log(`Removed entity type ${entityType} from tag ${tagId}`);
    }
    
    return createSuccessResponse(true);
  });
};
