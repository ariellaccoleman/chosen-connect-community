
import { Tag } from '@/utils/tags/types';
import { EntityType, isValidEntityType } from '@/types/entityTypes';
import { TagApiOptions, TagOperations } from './types';
import { apiClient } from '@/api/core/apiClient';
import { logger } from '@/utils/logger';

/**
 * Create tag operations with provided options
 */
export function createTagOperations<T extends Tag>(options: TagApiOptions = {}): TagOperations<T> {
  // Get the table name from options or use default
  const TABLE_NAME = options.tableName || 'tags';

  return {
    /**
     * Get all tags
     */
    async getAll(): Promise<T[]> {
      logger.debug('TagOperations.getAll: Fetching all tags');
      
      const { data, error } = await apiClient.query(async (client) => {
        return client
          .from('tags')
          .select('*')
          .order('name');
      });
      
      if (error) {
        logger.error('Error fetching tags:', error);
        return [];
      }
      
      return data as T[];
    },
    
    /**
     * Get tag by ID
     */
    async getById(id: string): Promise<T | null> {
      logger.debug(`TagOperations.getById: Fetching tag with ID ${id}`);
      
      const { data, error } = await apiClient.query(async (client) => {
        return client
          .from('tags')
          .select('*')
          .eq('id', id)
          .single();
      });
      
      if (error) {
        logger.error(`Error fetching tag with ID ${id}:`, error);
        return null;
      }
      
      return data as T;
    },
    
    /**
     * Find tag by exact name match
     */
    async findByName(name: string): Promise<T | null> {
      logger.debug(`TagOperations.findByName: Finding tag with name ${name}`);
      
      const { data, error } = await apiClient.query(async (client) => {
        return client
          .from('tags')
          .select('*')
          .ilike('name', name)
          .single();
      });
      
      if (error) {
        // Not found errors are expected and should not be logged as errors
        if (error.code !== 'PGRST116') {
          logger.error(`Error finding tag with name ${name}:`, error);
        }
        return null;
      }
      
      return data as T;
    },

    /**
     * Search tags by partial name match
     */
    async searchByName(query: string): Promise<T[]> {
      logger.debug(`TagOperations.searchByName: Searching tags with query ${query}`);
      
      const { data, error } = await apiClient.query(async (client) => {
        return client
          .from('tags')
          .select('*')
          .ilike('name', `%${query}%`)
          .order('name')
          .limit(20);
      });
      
      if (error) {
        logger.error(`Error searching tags with query ${query}:`, error);
        return [];
      }
      
      return data as T[];
    },
    
    /**
     * Create a new tag
     */
    async create(data: Partial<T>): Promise<T> {
      logger.debug(`TagOperations.create: Creating new tag with name ${data.name}`);
      
      // Validate required fields
      if (!data.name) {
        throw new Error('Tag name is required');
      }
      
      const { data: createdTag, error } = await apiClient.query(async (client) => {
        return client
          .from('tags')
          .insert(data as any) // Using type assertion as a workaround
          .select()
          .single();
      });
      
      if (error) {
        logger.error(`Error creating tag:`, error);
        throw new Error(`Failed to create tag: ${error.message}`);
      }
      
      return createdTag as T;
    },
    
    /**
     * Update a tag
     */
    async update(id: string, data: Partial<T>): Promise<T> {
      logger.debug(`TagOperations.update: Updating tag with ID ${id}`);
      
      const { data: updatedTag, error } = await apiClient.query(async (client) => {
        return client
          .from('tags')
          .update(data)
          .eq('id', id)
          .select()
          .single();
      });
      
      if (error) {
        logger.error(`Error updating tag with ID ${id}:`, error);
        throw new Error(`Failed to update tag: ${error.message}`);
      }
      
      return updatedTag as T;
    },
    
    /**
     * Delete a tag
     */
    async delete(id: string): Promise<boolean> {
      logger.debug(`TagOperations.delete: Deleting tag with ID ${id}`);
      
      const { error } = await apiClient.query(async (client) => {
        return client
          .from('tags')
          .delete()
          .eq('id', id);
      });
      
      if (error) {
        logger.error(`Error deleting tag with ID ${id}:`, error);
        throw new Error(`Failed to delete tag: ${error.message}`);
      }
      
      return true;
    },
    
    /**
     * Find or create a tag
     */
    async findOrCreate(data: Partial<T>, entityType?: EntityType): Promise<T> {
      logger.debug(`TagOperations.findOrCreate: Finding or creating tag with name ${data.name}`);
      
      // Validate required fields
      if (!data.name) {
        throw new Error('Tag name is required');
      }
      
      // Try to find the tag first
      const existingTag = await this.findByName(data.name);
      
      if (existingTag) {
        logger.debug(`Found existing tag with name ${data.name}`);
        return existingTag;
      }
      
      // If not found, create new tag
      logger.debug(`Creating new tag with name ${data.name}`);
      const newTag = await this.create(data);
      
      // If entityType is provided, associate the tag with it
      if (entityType && isValidEntityType(entityType)) {
        try {
          const { updateTagEntityType } = await import('@/api/tags/tagEntityTypesApi');
          await updateTagEntityType(newTag.id, entityType);
        } catch (error) {
          logger.warn(`Error associating tag with entity type: ${error}`);
          // Continue even if this fails
        }
      }
      
      return newTag;
    },
    
    /**
     * Get tags by entity type
     */
    async getByEntityType(entityType: EntityType): Promise<T[]> {
      logger.debug(`TagOperations.getByEntityType: Getting tags for entity type ${entityType}`);
      
      if (!isValidEntityType(entityType)) {
        logger.error(`Invalid entity type: ${entityType}`);
        return [];
      }
      
      try {
        const { data, error } = await apiClient.query(async (client) => {
          return client
            .from('tag_entity_types')
            .select(`tag:tags(*)`)
            .eq('entity_type', entityType);
        });
        
        if (error) {
          logger.error(`Error fetching tags for entity type ${entityType}:`, error);
          return [];
        }
        
        // Extract tags from the response
        const tags = data.map((item: any) => item.tag) as T[];
        return tags;
        
      } catch (error) {
        logger.error(`Error in getByEntityType:`, error);
        return [];
      }
    }
  };
}
