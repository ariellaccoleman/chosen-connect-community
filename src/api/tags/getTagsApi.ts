import { Tag } from "@/utils/tags/types";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";
import { typedRpc } from "../core/typedRpc";
import { logger } from "@/utils/logger";

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
    try {
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
    } catch (err) {
      logger.error("Error in getFilterTags", err);
      return createSuccessResponse([]);
    }
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
    try {
      // First check if the tag_entity_types table exists using a simpler query
      const { data: schemaCheck, error: schemaError } = await client
        .from('pg_tables')
        .select('tablename')
        .eq('tablename', 'tag_entity_types')
        .eq('schemaname', 'public');
        
      const tableExists = schemaCheck && schemaCheck.length > 0;
      
      if (!tableExists) {
        logger.warn("tag_entity_types table doesn't exist, falling back to tag_assignments for filtering");
        
        // If table doesn't exist, fall back to a simpler query based on tag_assignments
        if (options.targetType) {
          const { data, error } = await client
            .from('tags')
            .select('*')
            .order('name');

          if (error) throw error;
          return createSuccessResponse(data || []);
        }
      }
      
      // If table exists, proceed with cached query logic
      if (options.targetType && !options.skipCache && !options.searchQuery && 
          !options.type && !options.createdBy) {
        try {
          // Try to get from cache
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
        } catch (cacheErr) {
          logger.warn("Cache retrieval failed, continuing with direct query", cacheErr);
        }
      }
      
      // Fall back to simple query if tag_entity_types doesn't exist or for other scenarios
      if (!tableExists || !options.targetType) {
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
      }

      // If the table exists, query with tag entity types
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
      
      return createSuccessResponse(data || []);
    } catch (err) {
      logger.error("Error in getSelectionTags:", err);
      return createSuccessResponse([]);
    }
  });
};

// Keep backward compatibility - alias to getSelectionTags
export const getTags = getSelectionTags;
