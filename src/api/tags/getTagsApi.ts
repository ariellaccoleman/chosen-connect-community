import { Tag } from "@/utils/tags";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";
import { typedRpc } from "../core/typedRpc";
import { Database } from "@/integrations/supabase/types";

/**
 * API functions for retrieving tags with various filters
 */

/**
 * Get tags for filtering purposes - returns only tags that have been assigned to entities
 * of the specified type
 */
export const getFilterTags = async (options: {
  type?: string;
  createdBy?: string;
  searchQuery?: string;
  targetType?: string;
} = {}): Promise<ApiResponse<Tag[]>> => {
  return apiClient.query(async (client) => {
    // If we're filtering by target type, use an optimized query
    if (options.targetType) {
      // Direct join query for better performance when filtering by target type
      const joinQuery = `
        SELECT DISTINCT t.*
        FROM tags t
        INNER JOIN tag_assignments ta ON t.id = ta.tag_id
        WHERE ta.target_type = '${options.targetType}'
        ${options.type ? `AND t.type = '${options.type}'` : ''}
        ${options.createdBy ? `AND t.created_by = '${options.createdBy}'` : ''}
        ${options.searchQuery ? `AND t.name ILIKE '%${options.searchQuery}%'` : ''}
        ORDER BY t.name
      `;
      
      const { data, error } = await typedRpc(
        client,
        'query_tags', 
        { query_text: joinQuery }
      );
      
      if (error) throw error;
      
      return createSuccessResponse(data || []);
    }
    
    // For non-targetType queries, use the standard approach
    let query = client.from('tags').select('*');
    
    // Apply filters
    if (options.type) {
      query = query.eq('type', options.type);
    }
    
    if (options.createdBy) {
      query = query.eq('created_by', options.createdBy);
    }
    
    if (options.searchQuery) {
      query = query.ilike('name', `%${options.searchQuery}%`);
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
  createdBy?: string;
  searchQuery?: string;
  targetType?: string;
  skipCache?: boolean;
} = {}): Promise<ApiResponse<Tag[]>> => {
  return apiClient.query(async (client) => {
    // First try to get from cache if we have a simple query and skipCache is not true
    if (options.targetType && !options.skipCache && !options.searchQuery && !options.type && 
        !options.createdBy) {
      // Use more reliable function-based caching since the 'cache' table isn't in TypeScript types
      const cacheKey = `selection_tags_${options.targetType}`;
      
      // Check if we have a cached result using a custom query
      const { data: cachedResults, error: cacheError } = await typedRpc(
        client,
        'get_cached_tags', 
        { cache_key: cacheKey }
      );
      
      if (!cacheError && cachedResults && Array.isArray(cachedResults) && cachedResults.length > 0) {
        return createSuccessResponse(cachedResults);
      }
    }
    
    // If we have a targetType, optimize the query
    if (options.targetType) {
      // Optimized query to get entity-specific tags and general tags
      const query = `
        WITH entity_type_tags AS (
          SELECT tag_id 
          FROM tag_entity_types 
          WHERE entity_type = '${options.targetType}'
        ),
        all_entity_type_tags AS (
          SELECT DISTINCT tag_id 
          FROM tag_entity_types
        )
        SELECT t.* 
        FROM tags t
        WHERE 
          ${options.type ? `t.type = '${options.type}' AND` : ''}
          ${options.createdBy ? `t.created_by = '${options.createdBy}' AND` : ''}
          ${options.searchQuery ? `t.name ILIKE '%${options.searchQuery}%' AND` : ''}
          (
            t.id IN (SELECT tag_id FROM entity_type_tags) 
            OR t.id NOT IN (SELECT tag_id FROM all_entity_type_tags)
          )
        ORDER BY t.name
      `;

      const { data, error } = await typedRpc(
        client,
        'query_tags', 
        { query_text: query }
      );
      
      if (error) throw error;
      
      // Cache the result if it's a simple query and we're not explicitly skipping cache
      if (!options.skipCache && !options.searchQuery && !options.type && !options.createdBy) {
        const cacheKey = `selection_tags_${options.targetType}`;
        // Use a function to update the cache since we don't have the cache table in TypeScript types
        await typedRpc(
          client,
          'update_tag_cache', 
          { 
            cache_key: cacheKey, 
            cache_data: data || [] 
          }
        );
      }
      
      return createSuccessResponse(data || []);
    }
    
    // For non-targetType queries, use the standard approach
    let query = client.from('tags').select('*');
    
    // Apply filters
    if (options.type) {
      query = query.eq('type', options.type);
    }
    
    if (options.createdBy) {
      query = query.eq('created_by', options.createdBy);
    }
    
    if (options.searchQuery) {
      query = query.ilike('name', `%${options.searchQuery}%`);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) throw error;
    
    return createSuccessResponse(data || []);
  });
};

// Keep backward compatibility - alias to getSelectionTags
export const getTags = getSelectionTags;
