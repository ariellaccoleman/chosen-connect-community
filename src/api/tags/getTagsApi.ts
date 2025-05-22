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
      
      // Use the new filtered_entity_tags_view for more efficient querying
      let query = `
        SELECT DISTINCT t.*
        FROM filtered_entity_tags_view t
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      // Add filters based on options
      if (options.targetType) {
        query += ` AND t.entity_type = $${paramIndex++}`;
        params.push(options.targetType);
      }
      
      if (options.createdBy) {
        query += ` AND t.created_by = $${paramIndex++}`;
        params.push(options.createdBy);
      }
      
      if (options.searchQuery) {
        query += ` AND t.name ILIKE $${paramIndex++}`;
        params.push(`%${options.searchQuery}%`);
      }
      
      // Add ordering
      query += ` ORDER BY t.name`;
      
      try {
        const { data, error } = await typedRpc(
          client,
          'query_tags', 
          { query_text: query, params: params }
        );
        
        if (error) {
          logger.warn("Error in query_tags RPC:", error);
          throw error;
        }
        
        logger.debug(`getFilterTags found ${data?.length || 0} tags`);
        return createSuccessResponse(data || []);
      } catch (rpcError) {
        logger.warn("RPC query failed, falling back to direct query:", rpcError);
        
        // Fall back to querying the filtered_entity_tags_view directly if RPC fails
        let fallbackQuery = client.from('filtered_entity_tags_view').select('*');
        
        if (options.targetType) {
          fallbackQuery = fallbackQuery.eq('entity_type', options.targetType);
        }
        
        if (options.createdBy) {
          fallbackQuery = fallbackQuery.eq('created_by', options.createdBy);
        }
        
        if (options.searchQuery) {
          fallbackQuery = fallbackQuery.ilike('name', `%${options.searchQuery}%`);
        }
        
        const { data, error } = await fallbackQuery.order('name');
        
        if (error) {
          logger.error("Error in direct filtered_entity_tags_view query:", error);
          throw error;
        }
        
        logger.debug(`getFilterTags fallback query found ${data?.length || 0} tags`);
        return createSuccessResponse(data || []);
      }
    } catch (err) {
      logger.error("Error in getFilterTags", err);
      return createSuccessResponse([]);
    }
  });
};

/**
 * Get tags for selection purposes - returns all tags with their entity types
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
      
      // Use our new all_tags_with_entity_types_view for efficient querying
      let query;
      
      if (options.targetType) {
        // If target type is specified, get tags that are either specific to this entity type 
        // or don't have any entity type associations
        query = `
          SELECT *
          FROM all_tags_with_entity_types_view
          WHERE $1 = ANY(entity_types) OR array_length(entity_types, 1) IS NULL
        `;
        
        if (options.searchQuery) {
          query += ` AND name ILIKE $2`;
          
          try {
            const { data, error } = await typedRpc(
              client,
              'query_tags', 
              { 
                query_text: query, 
                params: [options.targetType, `%${options.searchQuery}%`] 
              }
            );
            
            if (error) throw error;
            logger.debug(`getSelectionTags found ${data?.length || 0} tags with entity type filter`);
            return createSuccessResponse(data || []);
          } catch (e) {
            logger.warn("Entity-specific RPC query failed:", e);
          }
        } else {
          try {
            const { data, error } = await typedRpc(
              client,
              'query_tags', 
              { 
                query_text: query, 
                params: [options.targetType] 
              }
            );
            
            if (error) throw error;
            logger.debug(`getSelectionTags found ${data?.length || 0} tags with entity type filter`);
            return createSuccessResponse(data || []);
          } catch (e) {
            logger.warn("Entity-specific RPC query failed:", e);
          }
        }
      }
      
      // If the above didn't return or targetType wasn't specified, get all tags
      query = `
        SELECT *
        FROM all_tags_with_entity_types_view
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      if (options.searchQuery) {
        query += ` AND name ILIKE $${paramIndex++}`;
        params.push(`%${options.searchQuery}%`);
      }
      
      if (options.createdBy) {
        query += ` AND created_by = $${paramIndex++}`;
        params.push(options.createdBy);
      }
      
      query += ` ORDER BY name`;
      
      try {
        const { data, error } = await typedRpc(
          client,
          'query_tags', 
          { query_text: query, params }
        );
        
        if (error) throw error;
        logger.debug(`getSelectionTags found ${data?.length || 0} tags with standard query`);
        return createSuccessResponse(data || []);
      } catch (e) {
        // Final fallback to direct query
        logger.warn("Standard RPC query failed, falling back to direct query:", e);
        
        // Note: We can't query entity_types directly in a normal query with the current setup
        // since it's an array type. We'll need to add them after fetching.
        const { data, error } = await client
          .from('tags')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        // Fetch entity types for each tag
        if (data && data.length > 0) {
          const tagIds = data.map(tag => tag.id);
          const { data: entityTypesData, error: entityTypesError } = await client
            .from('tag_entity_types')
            .select('tag_id, entity_type')
            .in('tag_id', tagIds);
          
          if (!entityTypesError && entityTypesData) {
            // Create a map of tag_id -> entity_types
            const entityTypeMap = new Map<string, string[]>();
            entityTypesData.forEach(item => {
              const types = entityTypeMap.get(item.tag_id) || [];
              types.push(item.entity_type);
              entityTypeMap.set(item.tag_id, types);
            });
            
            // Add entity_types to each tag
            data.forEach(tag => {
              // Ensure each tag object has the entity_types property
              (tag as Tag).entity_types = entityTypeMap.get(tag.id) || [];
            });
          }
        }
        
        logger.debug(`getSelectionTags direct query found ${data?.length || 0} tags`);
        return createSuccessResponse(data || []);
      }
    } catch (err) {
      logger.error("Error in getSelectionTags:", err);
      // Always return empty array rather than error to prevent UI from breaking
      return createSuccessResponse([]);
    }
  });
};

// Keep backward compatibility - alias to getSelectionTags
export const getTags = getSelectionTags;
