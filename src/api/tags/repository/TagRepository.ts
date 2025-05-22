/**
 * Tag Repository
 * Repository implementation for managing tags
 */
import { DataRepository } from "@/api/core/repository";
import { supabase } from "@/integrations/supabase/client";
import { Tag } from "@/utils/tags/types";
import { logger } from "@/utils/logger";
import { EntityType } from "@/types/entityTypes";

/**
 * Tag repository interface
 */
export interface TagRepository {
  /**
   * Get all tags
   */
  getAllTags(): Promise<Tag[]>;
  
  /**
   * Get a tag by ID
   */
  getTagById(id: string): Promise<Tag | null>;
  
  /**
   * Get tags by entity type
   */
  getTagsByEntityType(entityType: EntityType): Promise<Tag[]>;
  
  /**
   * Find a tag by name
   */
  findTagByName(name: string): Promise<Tag | null>;
  
  /**
   * Search tags
   */
  searchTags(query: string): Promise<Tag[]>;
  
  /**
   * Create a new tag
   */
  createTag(data: Partial<Tag>): Promise<Tag>;
  
  /**
   * Update a tag
   */
  updateTag(id: string, data: Partial<Tag>): Promise<Tag>;
  
  /**
   * Delete a tag
   */
  deleteTag(id: string): Promise<void>;
  
  /**
   * Find or create a tag by name
   */
  findOrCreateTag(name: string): Promise<Tag>;
}

/**
 * Create a tag repository
 * @returns TagRepository instance
 */
export function createTagRepository(): TagRepository {
  const repository = new DataRepository<Tag>("tags", supabase);
  
  return {
    async getAllTags(): Promise<Tag[]> {
      try {
        const result = await repository.findAll({
          orderBy: { column: 'name', ascending: true }
        });
        return result.data || [];
      } catch (err) {
        logger.error("Error fetching all tags:", err);
        return [];
      }
    },
    
    async getTagById(id: string): Promise<Tag | null> {
      try {
        const result = await repository.findById(id);
        return result.data || null;
      } catch (err) {
        logger.error(`Error fetching tag with ID ${id}:`, err);
        return null;
      }
    },
    
    async getTagsByEntityType(entityType: EntityType): Promise<Tag[]> {
      try {
        const result = await repository.query(`
          SELECT DISTINCT t.*
          FROM tags t
          JOIN tag_entity_types tet ON t.id = tet.tag_id
          WHERE tet.entity_type = '${entityType}'
          ORDER BY t.name ASC
        `);
        return result.data || [];
      } catch (err) {
        logger.error(`Error fetching tags for entity type ${entityType}:`, err);
        return [];
      }
    },
    
    async findTagByName(name: string): Promise<Tag | null> {
      try {
        const normalizedName = name.trim().toLowerCase();
        const result = await repository.findOne({
          filters: {
            name: normalizedName
          },
          caseSensitive: false
        });
        
        return result.data || null;
      } catch (err) {
        logger.error(`Error finding tag by name "${name}":`, err);
        return null;
      }
    },
    
    async searchTags(query: string): Promise<Tag[]> {
      try {
        const normalizedQuery = query.trim().toLowerCase();
        
        // If empty query, return all tags
        if (!normalizedQuery) {
          const result = await repository.findAll({
            orderBy: { column: 'name', ascending: true },
            limit: 50
          });
          return result.data || [];
        }
        
        // Otherwise, search by name
        const result = await repository.textSearch({
          column: 'name',
          query: normalizedQuery,
          config: 'english'
        });
        return result.data || [];
      } catch (err) {
        logger.error(`Error searching tags with query "${query}":`, err);
        return [];
      }
    },
    
    async createTag(data: Partial<Tag>): Promise<Tag> {
      try {
        const result = await repository.create(data);
        
        if (!result.data) {
          throw new Error("Failed to create tag");
        }
        
        return result.data;
      } catch (err) {
        logger.error("Error creating tag:", err);
        throw err;
      }
    },
    
    async updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
      try {
        const result = await repository.update(id, data);
        
        if (!result.data) {
          throw new Error("Failed to update tag");
        }
        
        return result.data;
      } catch (err) {
        logger.error(`Error updating tag ${id}:`, err);
        throw err;
      }
    },
    
    async deleteTag(id: string): Promise<void> {
      try {
        await repository.delete(id);
      } catch (err) {
        logger.error(`Error deleting tag ${id}:`, err);
        throw err;
      }
    },
    
    async findOrCreateTag(name: string): Promise<Tag> {
      try {
        const normalizedName = name.trim().toLowerCase();
        
        // Try to find existing tag
        const existingTag = await this.findTagByName(normalizedName);
        if (existingTag) {
          return existingTag;
        }
        
        // Create new tag if not found
        return await this.createTag({ name: normalizedName });
      } catch (err) {
        logger.error(`Error in find or create tag "${name}":`, err);
        throw err;
      }
    }
  };
}
