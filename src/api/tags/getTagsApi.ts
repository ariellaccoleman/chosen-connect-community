import { Tag } from "@/utils/tags";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";

/**
 * API functions for retrieving tags with various filters
 */

/**
 * Get tags for filtering purposes - returns only tags that have been assigned to entities
 * of the specified type
 */
export const getFilterTags = async (options: {
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
    
    // Filter by entity type - only show tags that are actually assigned to this entity type
    if (options.targetType) {
      // Get tags that have been assigned to entities of this type
      const { data: tagIdsData, error: tagIdsError } = await client
        .from('tag_assignments')
        .select('tag_id')
        .eq('target_type', options.targetType);
      
      if (tagIdsError) throw tagIdsError;
      
      if (tagIdsData && tagIdsData.length > 0) {
        // Extract unique tag IDs
        const uniqueTagIds = [...new Set(tagIdsData.map(item => item.tag_id))];
        query = query.in('id', uniqueTagIds);
      } else {
        // If no tags are assigned to this entity type, return empty result
        return createSuccessResponse([]);
      }
    }
    
    const { data, error } = await query.order('name');
    
    if (error) throw error;
    
    return createSuccessResponse(data || []);
  });
};

/**
 * Get tags for selection purposes - returns both entity-specific tags and general tags
 * Used for typeaheads and selector components
 */
export const getSelectionTags = async (options: {
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
    
    // Filter by entity type - for selection, we want both entity-specific tags and general tags
    if (options.targetType) {
      // Get tags that are specifically for this entity type
      const { data: entityTypeTags, error: entityTypeError } = await client
        .from('tag_entity_types')
        .select('tag_id')
        .eq('entity_type', options.targetType);
        
      if (entityTypeError) throw entityTypeError;
      
      // Get all tags that have any entity type
      const { data: allTagsWithEntityTypes, error: allTagsError } = await client
        .from('tag_entity_types')
        .select('tag_id');
        
      if (allTagsError) throw allTagsError;
      
      // Get unique tag IDs by converting to a Set and back to an array
      const entityTypeTagIds = entityTypeTags?.map(item => item.tag_id) || [];
      const allEntityTypeTagIds = Array.from(new Set(allTagsWithEntityTypes?.map(item => item.tag_id) || []));
      
      if (allEntityTypeTagIds.length > 0) {
        // Create an OR filter to get:
        // 1. Tags that match our entity type, OR
        // 2. Tags that don't have any entity type at all
        query = query.or(`id.in.(${entityTypeTagIds.join(',')}),not.id.in.(${allEntityTypeTagIds.join(',')})`);
      }
    }
    
    const { data, error } = await query.order('name');
    
    if (error) throw error;
    
    return createSuccessResponse(data || []);
  });
};

// Keep backward compatibility - alias to getSelectionTags
export const getTags = getSelectionTags;
