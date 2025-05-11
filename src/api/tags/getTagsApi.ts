
import { Tag } from "@/utils/tags";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";

/**
 * API functions for retrieving tags with various filters
 */
export const getTags = async (options: {
  type?: string;
  isPublic?: boolean;
  createdBy?: string;
  searchQuery?: string;
  targetType?: string;
} = {}): Promise<ApiResponse<Tag[]>> => {
  return apiClient.query(async (client) => {
    // Start with the base query for tags
    let query = client.from('tags').select('*');
    
    // Apply filters
    if (options.type) {
      query = query.eq('type', options.type);
    }
    
    if (options.isPublic !== undefined) {
      query = query.eq('is_public', options.isPublic);
    }
    
    if (options.createdBy) {
      query = query.eq('created_by', options.createdBy);
    }
    
    if (options.searchQuery) {
      query = query.ilike('name', `%${options.searchQuery}%`);
    }
    
    // Use the tag_entity_types table for entity type filtering
    if (options.targetType) {
      // Build a query using the normalized table
      const { data: tagIds, error: tagIdsError } = await client
        .from('tag_entity_types')
        .select('tag_id')
        .eq('entity_type', options.targetType);
      
      if (tagIdsError) throw tagIdsError;
      
      if (tagIds && tagIds.length > 0) {
        // Get tags that either have this entity type or don't have any entity types
        const tagIdsArray = tagIds.map(item => item.tag_id);
        
        // Get all tags with any entity type
        const { data: allTagsWithEntityTypes, error: allTagsError } = await client
          .from('tag_entity_types')
          .select('tag_id');
          
        if (allTagsError) throw allTagsError;
        
        // Get unique tag IDs by converting to a Set and back to an array
        const uniqueTagIdsWithTypes = Array.from(new Set(allTagsWithEntityTypes?.map(item => item.tag_id) || []));
        
        if (uniqueTagIdsWithTypes.length > 0) {
          // Get tags that either match these IDs or tags that aren't in the tag_entity_types table
          query = query.or(`id.in.(${tagIdsArray.join(',')}),not.id.in.(${uniqueTagIdsWithTypes.join(',')})`);
        } else {
          // If no tags have entity types, just use the ones that match our entity type
          query = query.in('id', tagIdsArray);
        }
      } else {
        // If no tags have this entity type, get tags without any entity type
        const { data: allTagsWithEntityTypes, error: allTagsError } = await client
          .from('tag_entity_types')
          .select('tag_id');
          
        if (allTagsError) throw allTagsError;
        
        // Get unique tag IDs by converting to a Set and back to an array
        const uniqueTagIdsWithTypes = Array.from(new Set(allTagsWithEntityTypes?.map(item => item.tag_id) || []));
        
        if (uniqueTagIdsWithTypes.length > 0) {
          // Get tags that don't have any entity type
          query = query.not('id', 'in', `(${uniqueTagIdsWithTypes.join(',')})`);
        }
      }
    }
    
    const { data, error } = await query.order('name');
    
    if (error) throw error;
    
    return createSuccessResponse(data || []);
  });
};
