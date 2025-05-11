import { Tag } from "@/utils/tags";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";

/**
 * API functions for retrieving tags with various filters
 */

// Type definition for RPC functions to fix TypeScript errors
type RpcFunctions = {
  query_tags: (args: { query_text: string }) => Promise<Tag[]>;
  get_cached_tags: (args: { cache_key: string }) => Promise<Tag[]>;
  update_tag_cache: (args: { cache_key: string, cache_data: Tag[] }) => Promise<boolean>;
}

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
    // If we're filtering by target type, use an optimized query
    if (options.targetType) {
      // Direct join query for better performance when filtering by target type
      const joinQuery = `
        SELECT DISTINCT t.*
        FROM tags t
        INNER JOIN tag_assignments ta ON t.id = ta.tag_id
        WHERE ta.target_type = '${options.targetType}'
        ${options.type ? `AND t.type = '${options.type}'` : ''}
        ${options.isPublic !== undefined ? `AND t.is_public = ${options.isPublic}` : ''}
        ${options.createdBy ? `AND t.created_by = '${options.createdBy}'` : ''}
        ${options.searchQuery ? `AND t.name ILIKE '%${options.searchQuery}%'` : ''}
        ORDER BY t.name
      `;
      
      const { data, error } = await client.rpc<Tag[], 'query_tags'>('query_tags', { query_text: joinQuery });
      
      if (error) throw error;
      
      return createSuccessResponse(data || []);
    }
    
    // For non-targetType queries, use the standard approach
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
    // First try to get from cache if we have a simple query
    if (options.targetType && !options.searchQuery && !options.type && 
        options.isPublic === undefined && !options.createdBy) {
      // Use more reliable function-based caching since the 'cache' table isn't in TypeScript types
      const cacheKey = `selection_tags_${options.targetType}`;
      
      // Check if we have a cached result using a custom query
      const { data: cachedResults, error: cacheError } = await client.rpc<Tag[], 'get_cached_tags'>('get_cached_tags', { 
        cache_key: cacheKey 
      });
      
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
          ${options.isPublic !== undefined ? `t.is_public = ${options.isPublic} AND` : ''}
          ${options.createdBy ? `t.created_by = '${options.createdBy}' AND` : ''}
          ${options.searchQuery ? `t.name ILIKE '%${options.searchQuery}%' AND` : ''}
          (
            t.id IN (SELECT tag_id FROM entity_type_tags) 
            OR t.id NOT IN (SELECT tag_id FROM all_entity_type_tags)
          )
        ORDER BY t.name
      `;

      const { data, error } = await client.rpc<Tag[], 'query_tags'>('query_tags', { query_text: query });
      
      if (error) throw error;
      
      // Cache the result if it's a simple query
      if (!options.searchQuery && !options.type && options.isPublic === undefined && !options.createdBy) {
        const cacheKey = `selection_tags_${options.targetType}`;
        // Use a function to update the cache since we don't have the cache table in TypeScript types
        await client.rpc<boolean, 'update_tag_cache'>('update_tag_cache', { 
          cache_key: cacheKey, 
          cache_data: data || [] 
        });
      }
      
      return createSuccessResponse(data || []);
    }
    
    // For non-targetType queries, use the standard approach
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
    
    const { data, error } = await query.order('name');
    
    if (error) throw error;
    
    return createSuccessResponse(data || []);
  });
};

// Keep backward compatibility - alias to getSelectionTags
export const getTags = getSelectionTags;
