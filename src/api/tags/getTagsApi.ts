import { Tag } from "@/utils/tags/types";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "../core/errorHandler";
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
  createdBy?: string;
  searchQuery?: string;
  targetType?: string;
  skipCache?: boolean;
} = {}): Promise<ApiResponse<Tag[]>> => {
  return apiClient.query(async (client) => {
    try {
      logger.debug("getFilterTags called with options:", options);
      
      // If we're filtering by target type, use an optimized query
      if (options.targetType) {
        // Direct join query for better performance when filtering by target type
        const joinQuery = `
          SELECT DISTINCT t.*
          FROM tags t
          INNER JOIN tag_assignments ta ON t.id = ta.tag_id
          WHERE ta.target_type = '${options.targetType}'
          ${options.createdBy ? `AND t.created_by = '${options.createdBy}'` : ''}
          ${options.searchQuery ? `AND t.name ILIKE '%${options.searchQuery}%'` : ''}
          ORDER BY t.name
        `;
        
        try {
          const { data, error } = await typedRpc(
            client,
            'query_tags', 
            { query_text: joinQuery }
          );
          
          if (error) {
            logger.warn("Error in query_tags RPC:", error);
            throw error;
          }
          
          logger.debug(`getFilterTags found ${data?.length || 0} tags`);
          return createSuccessResponse(data || []);
        } catch (rpcError) {
          logger.warn("RPC query failed, falling back to direct query:", rpcError);
          // Fall back to direct query if RPC fails
        }
      }
      
      // For non-targetType queries or as a fallback, use the standard approach
      let query = client.from('tags').select('*');
      
      // Apply filters
      if (options.createdBy) {
        query = query.eq('created_by', options.createdBy);
      }
      
      if (options.searchQuery) {
        query = query.ilike('name', `%${options.searchQuery}%`);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) {
        logger.error("Error in direct tags query:", error);
        throw error;
      }
      
      logger.debug(`getFilterTags direct query found ${data?.length || 0} tags`);
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
  createdBy?: string;
  searchQuery?: string;
  targetType?: string;
  skipCache?: boolean;
} = {}): Promise<ApiResponse<Tag[]>> => {
  return apiClient.query(async (client) => {
    try {
      logger.debug("getSelectionTags called with options:", options);
      
      // First check if the tag_entity_types table exists by trying a simple query
      let tableExists = true;
      try {
        const { data: tableCheck, error: testError } = await client.rpc('query_tags', { 
          query_text: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tag_entity_types')"
        });
        
        if (testError || !tableCheck || tableCheck.length === 0) {
          tableExists = false;
          logger.warn("tag_entity_types table check failed:", testError || "No data returned");
        }
      } catch (checkError) {
        tableExists = false;
        logger.warn("Error checking tag_entity_types table existence:", checkError);
      }
        
      if (!tableExists) {
        logger.warn("tag_entity_types table doesn't exist or is not accessible");
        
        // If table doesn't exist, fall back to a simpler query
        const { data, error } = await client
          .from('tags')
          .select('*')
          .order('name');

        if (error) throw error;
        
        logger.debug(`getSelectionTags fallback found ${data?.length || 0} tags`);
        return createSuccessResponse(data || []);
      }
      
      // If table exists and we have an entity type, try to get tags specifically for that entity type
      if (options.targetType) {
        // Updated query that properly uses tag_entity_types to filter by entity type
        // Get all tags that either:
        // 1. Have an explicit association with this entity type
        // 2. Don't have any entity type associations at all (general tags)
        const query = `
          WITH 
          entity_specific_tags AS (
            SELECT t.*, ARRAY_AGG(tet.entity_type) as entity_types
            FROM tags t
            JOIN tag_entity_types tet ON t.id = tet.tag_id
            WHERE tet.entity_type = '${options.targetType}'
            ${options.searchQuery ? `AND t.name ILIKE '%${options.searchQuery}%'` : ''}
            GROUP BY t.id
          ),
          general_tags AS (
            SELECT t.*, ARRAY[]::text[] as entity_types
            FROM tags t
            WHERE t.id NOT IN (
              SELECT DISTINCT tag_id FROM tag_entity_types
            )
            ${options.searchQuery ? `AND t.name ILIKE '%${options.searchQuery}%'` : ''}
          )
          SELECT * FROM entity_specific_tags
          UNION ALL
          SELECT * FROM general_tags
          ORDER BY name
        `;

        try {
          const { data, error } = await typedRpc(
            client,
            'query_tags', 
            { query_text: query }
          );
          
          if (error) {
            logger.warn("Error in entity type-specific query_tags RPC:", error);
            throw error;
          }
          
          if (data && data.length > 0) {
            logger.debug(`getSelectionTags entity-specific query found ${data.length} tags`);
            return createSuccessResponse(data);
          } else {
            logger.warn("Entity-specific tag query returned no results, falling back to all tags");
          }
        } catch (rpcError) {
          logger.warn("Entity-specific RPC query failed, falling back to all tags:", rpcError);
        }
      }

      // Fall back to getting all tags if no entity type specified or if the specific query failed
      // Also attempt to include entity_types information
      const query = `
        SELECT t.*, 
          (
            SELECT ARRAY_AGG(tet.entity_type)
            FROM tag_entity_types tet
            WHERE tet.tag_id = t.id
          ) as entity_types
        FROM tags t
        ${options.searchQuery ? `WHERE t.name ILIKE '%${options.searchQuery}%'` : ''}
        ORDER BY t.name
      `;
      
      try {
        const { data, error } = await typedRpc(
          client,
          'query_tags', 
          { query_text: query }
        );
        
        if (error) {
          logger.warn("Error in fallback query with entity_types:", error);
          // If this fails, fall back to simple query
          const { data: simpleData, error: simpleError } = await client
            .from('tags')
            .select('*')
            .order('name');
        
          if (simpleError) throw simpleError;
          
          return createSuccessResponse(simpleData || []);
        }
        
        logger.debug(`getSelectionTags with entity_types query found ${data?.length || 0} tags`);
        return createSuccessResponse(data || []);
      } catch (e) {
        // Final fallback to simple query
        const { data, error } = await client
          .from('tags')
          .select('*')
          .order('name');
      
        if (error) throw error;
        
        logger.debug(`getSelectionTags simple fallback found ${data?.length || 0} tags`);
        return createSuccessResponse(data || []);
      }
    } catch (err) {
      logger.error("Error in getSelectionTags:", err);
      // Return empty list rather than error to prevent UI from breaking
      return createSuccessResponse([]);
    }
  });
};

// Keep backward compatibility - alias to getSelectionTags
export const getTags = getSelectionTags;
