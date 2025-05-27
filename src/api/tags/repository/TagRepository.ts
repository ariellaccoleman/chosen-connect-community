
/**
 * Tag Repository
 * Repository implementation for managing tags
 */
import { apiClient } from "@/api/core/apiClient";
import { Tag } from "@/utils/tags/types";
import { logger } from "@/utils/logger";
import { EntityType } from "@/types/entityTypes";
import { ApiResponse, createSuccessResponse } from "@/api/core/errorHandler";

/**
 * Tag repository interface
 */
export interface TagRepository {
  /**
   * Get all tags
   */
  getAllTags(): Promise<ApiResponse<Tag[]>>;
  
  /**
   * Get a tag by ID
   */
  getTagById(id: string): Promise<ApiResponse<Tag | null>>;
  
  /**
   * Get tags by entity type
   */
  getTagsByEntityType(entityType: EntityType): Promise<ApiResponse<Tag[]>>;
  
  /**
   * Find a tag by name
   */
  findTagByName(name: string): Promise<ApiResponse<Tag | null>>;
  
  /**
   * Search tags
   */
  searchTags(query: string): Promise<ApiResponse<Tag[]>>;
  
  /**
   * Create a new tag
   */
  createTag(data: Partial<Tag>): Promise<ApiResponse<Tag>>;
  
  /**
   * Update a tag
   */
  updateTag(id: string, data: Partial<Tag>): Promise<ApiResponse<Tag>>;
  
  /**
   * Delete a tag
   */
  deleteTag(id: string): Promise<ApiResponse<boolean>>;
  
  /**
   * Find or create a tag by name
   */
  findOrCreateTag(name: string): Promise<ApiResponse<Tag>>;
  
  /**
   * Associate a tag with an entity type
   */
  associateTagWithEntityType(tagId: string, entityType: EntityType): Promise<void>;
}

/**
 * Create a tag repository
 * @param providedClient - Optional Supabase client instance
 * @returns TagRepository instance
 */
export function createTagRepository(providedClient?: any): TagRepository {
  
  return {
    async getAllTags(): Promise<ApiResponse<Tag[]>> {
      try {
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from('tags')
            .select('*')
            .order('name', { ascending: true });
          
          if (error) throw error;
          return createSuccessResponse(data || []);
        }, providedClient);
      } catch (err) {
        logger.error("Error fetching all tags:", err);
        return createSuccessResponse([]);
      }
    },
    
    async getTagById(id: string): Promise<ApiResponse<Tag | null>> {
      try {
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from('tags')
            .select('*')
            .eq('id', id)
            .maybeSingle();
          
          if (error) throw error;
          return createSuccessResponse(data || null);
        }, providedClient);
      } catch (err) {
        logger.error(`Error fetching tag with ID ${id}:`, err);
        return createSuccessResponse(null);
      }
    },
    
    async getTagsByEntityType(entityType: EntityType): Promise<ApiResponse<Tag[]>> {
      try {
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .rpc('query_tags', {
              query_text: `
                SELECT DISTINCT t.*
                FROM tags t
                JOIN tag_entity_types tet ON t.id = tet.tag_id
                WHERE tet.entity_type = '${entityType}'
                ORDER BY t.name ASC
              `
            });
          
          if (error) throw error;
          return createSuccessResponse(data || []);
        }, providedClient);
      } catch (err) {
        logger.error(`Error fetching tags for entity type ${entityType}:`, err);
        return createSuccessResponse([]);
      }
    },
    
    async findTagByName(name: string): Promise<ApiResponse<Tag | null>> {
      try {
        const normalizedName = name.trim().toLowerCase();
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from('tags')
            .select('*')
            .ilike('name', normalizedName)
            .maybeSingle();
          
          if (error) throw error;
          return createSuccessResponse(data || null);
        }, providedClient);
      } catch (err) {
        logger.error(`Error finding tag by name "${name}":`, err);
        return createSuccessResponse(null);
      }
    },
    
    async searchTags(query: string): Promise<ApiResponse<Tag[]>> {
      try {
        const normalizedQuery = query.trim().toLowerCase();
        
        return await apiClient.query(async (client) => {
          let queryBuilder;
          
          // If empty query, return all tags
          if (!normalizedQuery) {
            queryBuilder = client
              .from('tags')
              .select('*')
              .order('name', { ascending: true })
              .limit(50);
          } else {
            // Search by name
            queryBuilder = client
              .from('tags')
              .select('*')
              .ilike('name', `%${normalizedQuery}%`);
          }
          
          const { data, error } = await queryBuilder;
          if (error) throw error;
          return createSuccessResponse(data || []);
        }, providedClient);
      } catch (err) {
        logger.error(`Error searching tags with query "${query}":`, err);
        return createSuccessResponse([]);
      }
    },
    
    async createTag(data: Partial<Tag>): Promise<ApiResponse<Tag>> {
      try {
        return await apiClient.query(async (client) => {
          const { data: result, error } = await client
            .from('tags')
            .insert(data)
            .select()
            .single();
          
          if (error) throw error;
          if (!result) throw new Error("Failed to create tag");
          
          return createSuccessResponse(result);
        }, providedClient);
      } catch (err) {
        logger.error("Error creating tag:", err);
        throw err;
      }
    },
    
    async updateTag(id: string, data: Partial<Tag>): Promise<ApiResponse<Tag>> {
      try {
        return await apiClient.query(async (client) => {
          const { data: result, error } = await client
            .from('tags')
            .update(data)
            .eq('id', id)
            .select()
            .single();
          
          if (error) throw error;
          if (!result) throw new Error("Failed to update tag");
          
          return createSuccessResponse(result);
        }, providedClient);
      } catch (err) {
        logger.error(`Error updating tag ${id}:`, err);
        throw err;
      }
    },
    
    async deleteTag(id: string): Promise<ApiResponse<boolean>> {
      try {
        return await apiClient.query(async (client) => {
          const { error } = await client
            .from('tags')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          return createSuccessResponse(true);
        }, providedClient);
      } catch (err) {
        logger.error(`Error deleting tag ${id}:`, err);
        throw err;
      }
    },
    
    async findOrCreateTag(name: string): Promise<ApiResponse<Tag>> {
      try {
        const normalizedName = name.trim().toLowerCase();
        
        // Try to find existing tag
        const existingTagResponse = await this.findTagByName(normalizedName);
        if (existingTagResponse.data) {
          return existingTagResponse;
        }
        
        // Create new tag if not found
        return await this.createTag({ name: normalizedName });
      } catch (err) {
        logger.error(`Error in find or create tag "${name}":`, err);
        throw err;
      }
    },
    
    async associateTagWithEntityType(tagId: string, entityType: EntityType): Promise<void> {
      try {
        // Import the TagEntityTypeRepository dynamically to avoid circular dependencies
        const { createTagEntityTypeRepository } = await import('./index');
        const tagEntityTypeRepo = createTagEntityTypeRepository(providedClient);
        
        // Associate the tag with the entity type
        await tagEntityTypeRepo.associateTagWithEntityType(tagId, entityType);
      } catch (err) {
        logger.error(`Error associating tag ${tagId} with entity type ${entityType}:`, err);
        throw err;
      }
    }
  };
}
