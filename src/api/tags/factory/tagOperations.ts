
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
    async getAll(providedClient?: any): Promise<T[]> {
      logger.debug('TagOperations.getAll: Fetching all tags');
      
      const { data, error } = await apiClient.query(async (client) => {
        return client
          .from('tags')
          .select('*')
          .order('name');
      }, providedClient);
      
      if (error) {
        logger.error('Error fetching tags:', error);
        return [];
      }
      
      return data as T[];
    },
    
    /**
     * Get tag by ID
     */
    async getById(id: string, providedClient?: any): Promise<T | null> {
      logger.debug(`TagOperations.getById: Fetching tag with ID ${id}`);
      
      const { data, error } = await apiClient.query(async (client) => {
        return client
          .from('tags')
          .select('*')
          .eq('id', id)
          .maybeSingle();
      }, providedClient);
      
      if (error) {
        logger.error(`Error fetching tag with ID ${id}:`, error);
        return null;
      }
      
      return data as T;
    },
    
    /**
     * Find tag by exact name match
     */
    async findByName(name: string, providedClient?: any): Promise<T | null> {
      logger.debug(`TagOperations.findByName: Finding tag with name ${name}`);
      
      const { data, error } = await apiClient.query(async (client) => {
        return client
          .from('tags')
          .select('*')
          .ilike('name', name)
          .maybeSingle();
      }, providedClient);
      
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
    async searchByName(query: string, providedClient?: any): Promise<T[]> {
      logger.debug(`TagOperations.searchByName: Searching tags with query ${query}`);
      
      const { data, error } = await apiClient.query(async (client) => {
        return client
          .from('tags')
          .select('*')
          .ilike('name', `%${query}%`)
          .order('name')
          .limit(20);
      }, providedClient);
      
      if (error) {
        logger.error(`Error searching tags with query ${query}:`, error);
        return [];
      }
      
      return data as T[];
    },
    
    /**
     * Create a new tag
     */
    async create(data: Partial<T>, providedClient?: any): Promise<T> {
      logger.debug(`TagOperations.create: Creating new tag with name ${data.name}`);
      
      // Validate required fields
      if (!data.name) {
        throw new Error('Tag name is required');
      }
      
      const { data: createdTag, error } = await apiClient.query(async (client) => {
        return client
          .from('tags')
          .insert(data as any)
          .select()
          .single();
      }, providedClient);
      
      if (error) {
        logger.error(`Error creating tag:`, error);
        throw new Error(`Failed to create tag: ${error.message}`);
      }
      
      return createdTag as T;
    },
    
    /**
     * Update a tag
     */
    async update(id: string, data: Partial<T>, providedClient?: any): Promise<T> {
      logger.debug(`TagOperations.update: Updating tag with ID ${id}`);
      
      // Validate that we have an ID
      if (!id) {
        throw new Error('Tag ID is required for update');
      }
      
      // First check if the tag exists
      const existingTag = await this.getById(id, providedClient);
      if (!existingTag) {
        throw new Error(`Tag with ID ${id} not found`);
      }
      
      const { data: updatedTag, error } = await apiClient.query(async (client) => {
        return client
          .from('tags')
          .update(data)
          .eq('id', id)
          .select()
          .maybeSingle();
      }, providedClient);
      
      if (error) {
        logger.error(`Error updating tag with ID ${id}:`, error);
        throw new Error(`Failed to update tag: ${error.message}`);
      }
      
      if (!updatedTag) {
        throw new Error(`No tag was updated with ID ${id}`);
      }
      
      return updatedTag as T;
    },
    
    /**
     * Delete a tag
     */
    async delete(id: string, providedClient?: any): Promise<boolean> {
      logger.debug(`TagOperations.delete: Deleting tag with ID ${id}`);
      
      // Validate that we have an ID
      if (!id) {
        throw new Error('Tag ID is required for delete');
      }
      
      // First check if the tag exists
      const existingTag = await this.getById(id, providedClient);
      if (!existingTag) {
        logger.warn(`Tag with ID ${id} not found for deletion`);
        return false;
      }
      
      const { error } = await apiClient.query(async (client) => {
        return client
          .from('tags')
          .delete()
          .eq('id', id);
      }, providedClient);
      
      if (error) {
        logger.error(`Error deleting tag with ID ${id}:`, error);
        throw new Error(`Failed to delete tag: ${error.message}`);
      }
      
      return true;
    },
    
    /**
     * Find or create a tag
     * Entity type associations are now handled automatically by SQL triggers
     */
    async findOrCreate(data: Partial<T>, entityType?: EntityType, providedClient?: any): Promise<T> {
      logger.debug(`TagOperations.findOrCreate: Finding or creating tag with name ${data.name}`);
      
      // Validate required fields
      if (!data.name) {
        throw new Error('Tag name is required');
      }
      
      // Try to find the tag first
      const existingTag = await this.findByName(data.name, providedClient);
      
      if (existingTag) {
        logger.debug(`Found existing tag with name ${data.name}`);
        return existingTag;
      }
      
      // If not found, create new tag
      logger.debug(`Creating new tag with name ${data.name}`);
      const newTag = await this.create(data, providedClient);
      
      // No need to manually associate with entity type - triggers will handle this
      // when tag assignments are created
      
      return newTag;
    },
    
    /**
     * Get tags by entity type
     */
    async getByEntityType(entityType: EntityType, providedClient?: any): Promise<T[]> {
      logger.debug(`TagOperations.getByEntityType: Getting tags for entity type ${entityType}`);
      
      if (!isValidEntityType(entityType)) {
        logger.error(`Invalid entity type: ${entityType}`);
        return [];
      }
      
      const { data, error } = await apiClient.query(async (client) => {
        return client
          .from('tag_entity_types_view')
          .select('*')
          .contains('entity_types', [entityType]);
      }, providedClient);
      
      if (error) {
        logger.error(`Error fetching tags for entity type ${entityType}:`, error);
        return [];
      }
      
      return data as T[];
    }
  };
}
