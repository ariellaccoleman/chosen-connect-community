
import { Tag, TagAssignment } from "@/utils/tagUtils";
import { apiClient } from "./core/apiClient";
import { ApiResponse, createSuccessResponse } from "./core/errorHandler";

/**
 * API module for tag-related operations
 */
export const tagsApi = {
  /**
   * Get all tags with optional filters
   */
  async getTags(options: {
    type?: string;
    isPublic?: boolean;
    createdBy?: string;
    searchQuery?: string;
    targetType?: string; // Parameter for entity type filtering
  } = {}): Promise<ApiResponse<Tag[]>> {
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
      
      // Use the tag_entity_types table for entity type filtering
      if (options.targetType) {
        // Build a query using the normalized table
        const { data: tagIds, error: tagIdsError } = await client
          .from('tag_entity_types')
          .select('tag_id')
          .eq('entity_type', options.targetType);
        
        if (tagIdsError) throw tagIdsError;
        
        if (tagIds && tagIds.length > 0) {
          // Get tags that either have this entity type or don't have any entity types
          const tagIdsArray = tagIds.map(item => item.tag_id);
          
          // Get all tags with any entity type
          const { data: allTagsWithEntityTypes, error: allTagsError } = await client
            .from('tag_entity_types')
            .select('tag_id');
            
          if (allTagsError) throw allTagsError;
          
          // Get unique tag IDs by converting to a Set and back to an array
          const uniqueTagIdsWithTypes = Array.from(new Set(allTagsWithEntityTypes?.map(item => item.tag_id) || []));
          
          if (uniqueTagIdsWithTypes.length > 0) {
            // Get tags that either match these IDs or tags that aren't in the tag_entity_types table
            query = query.or(`id.in.(${tagIdsArray.join(',')}),not.id.in.(${uniqueTagIdsWithTypes.join(',')})`);
          } else {
            // If no tags have entity types, just use the ones that match our entity type
            query = query.in('id', tagIdsArray);
          }
        } else {
          // If no tags have this entity type, get tags without any entity type
          const { data: allTagsWithEntityTypes, error: allTagsError } = await client
            .from('tag_entity_types')
            .select('tag_id');
            
          if (allTagsError) throw allTagsError;
          
          // Get unique tag IDs by converting to a Set and back to an array
          const uniqueTagIdsWithTypes = Array.from(new Set(allTagsWithEntityTypes?.map(item => item.tag_id) || []));
          
          if (uniqueTagIdsWithTypes.length > 0) {
            // Get tags that don't have any entity type
            query = query.not('id', 'in', `(${uniqueTagIdsWithTypes.join(',')})`);
          }
        }
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      
      return createSuccessResponse(data || []);
    });
  },
  
  /**
   * Get tags assigned to a specific entity
   */
  async getEntityTags(
    entityId: string,
    entityType: "person" | "organization"
  ): Promise<ApiResponse<TagAssignment[]>> {
    return apiClient.query(async (client) => {
      const { data, error } = await client
        .from('tag_assignments')
        .select(`
          *,
          tag:tags(*)
        `)
        .eq('target_id', entityId)
        .eq('target_type', entityType);
      
      if (error) throw error;
      
      // Ensure the response matches the TagAssignment type
      const formattedAssignments = (data || []).map(assignment => ({
        ...assignment,
        updated_at: assignment.updated_at || assignment.created_at
      }));
      
      return createSuccessResponse(formattedAssignments);
    });
  },
  
  /**
   * Create a new tag
   */
  async createTag(tagData: Partial<Tag>): Promise<ApiResponse<Tag>> {
    return apiClient.query(async (client) => {
      const { data, error } = await client
        .from('tags')
        .insert({
          name: tagData.name,
          description: tagData.description,
          type: tagData.type,
          is_public: tagData.is_public,
          created_by: tagData.created_by,
          used_entity_types: [] // Initialize with empty array
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return createSuccessResponse(data);
    });
  },
  
  /**
   * Update an existing tag
   */
  async updateTag(
    tagId: string,
    updates: Partial<Tag>
  ): Promise<ApiResponse<Tag>> {
    return apiClient.query(async (client) => {
      // Don't allow direct updates to used_entity_types from this API
      const { used_entity_types, ...safeUpdates } = updates;
      
      const { data, error } = await client
        .from('tags')
        .update(safeUpdates)
        .eq('id', tagId)
        .select()
        .single();
      
      if (error) throw error;
      
      return createSuccessResponse(data);
    });
  },
  
  /**
   * Delete a tag
   */
  async deleteTag(tagId: string): Promise<ApiResponse<boolean>> {
    return apiClient.query(async (client) => {
      const { error } = await client
        .from('tags')
        .delete()
        .eq('id', tagId);
      
      if (error) throw error;
      
      return createSuccessResponse(true);
    });
  },
  
  /**
   * Assign a tag to an entity
   */
  async assignTag(
    tagId: string,
    entityId: string,
    entityType: "person" | "organization"
  ): Promise<ApiResponse<TagAssignment>> {
    return apiClient.query(async (client) => {
      // First, create the tag assignment
      const { data, error } = await client
        .from('tag_assignments')
        .insert({
          tag_id: tagId,
          target_id: entityId,
          target_type: entityType
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Then, update the tag_entity_types table if needed
      // Check if this entity type is already registered for this tag
      const { data: existingType, error: typeCheckError } = await client
        .from('tag_entity_types')
        .select('id')
        .eq('tag_id', tagId)
        .eq('entity_type', entityType)
        .maybeSingle();
      
      if (typeCheckError) throw typeCheckError;
      
      // If this tag doesn't have this entity type yet, add it
      if (!existingType) {
        const { error: insertError } = await client
          .from('tag_entity_types')
          .insert({
            tag_id: tagId,
            entity_type: entityType
          });
        
        if (insertError) throw insertError;
      }
      
      // For backward compatibility, also update the used_entity_types array
      const { data: tagData } = await client
        .from('tags')
        .select('used_entity_types')
        .eq('id', tagId)
        .single();
      
      if (tagData) {
        // Cast used_entity_types to string[] to work with it safely
        let usedEntityTypes: string[] = [];
        
        if (Array.isArray(tagData.used_entity_types)) {
          // Convert all elements to strings to ensure type safety
          usedEntityTypes = (tagData.used_entity_types as any[]).map(item => String(item));
        } else if (tagData.used_entity_types) {
          try {
            const parsedValue = typeof tagData.used_entity_types === 'string' 
              ? JSON.parse(tagData.used_entity_types)
              : tagData.used_entity_types;
              
            usedEntityTypes = Array.isArray(parsedValue) ? parsedValue.map(item => String(item)) : [];
          } catch (e) {
            console.error("Error parsing used_entity_types:", e);
            usedEntityTypes = [];
          }
        }
        
        if (!usedEntityTypes.includes(entityType)) {
          // Create a new array by copying the old one and adding the new entity type
          const updatedEntityTypes = [...usedEntityTypes, entityType];
          
          await client
            .from('tags')
            .update({ used_entity_types: updatedEntityTypes })
            .eq('id', tagId);
        }
      }
      
      return createSuccessResponse(data);
    });
  },
  
  /**
   * Remove a tag assignment
   */
  async removeTagAssignment(assignmentId: string): Promise<ApiResponse<boolean>> {
    return apiClient.query(async (client) => {
      // First get the assignment details to identify tag_id and entity_type
      const { data: assignment, error: getError } = await client
        .from('tag_assignments')
        .select('tag_id, target_type')
        .eq('id', assignmentId)
        .maybeSingle();
      
      if (getError) throw getError;
      
      // Delete the assignment
      const { error: deleteError } = await client
        .from('tag_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (deleteError) throw deleteError;
      
      // If we found the assignment details, check if we need to update tag_entity_types
      if (assignment) {
        const tagId = assignment.tag_id;
        const entityType = assignment.target_type;
        
        // Check if this tag has any other assignments with this entity type
        const { data: otherAssignments, error: checkError } = await client
          .from('tag_assignments')
          .select('id')
          .eq('tag_id', tagId)
          .eq('target_type', entityType)
          .neq('id', assignmentId)
          .limit(1);
        
        if (checkError) throw checkError;
        
        // If no other assignments with this type, remove from tag_entity_types
        if (!otherAssignments || otherAssignments.length === 0) {
          const { error: removeError } = await client
            .from('tag_entity_types')
            .delete()
            .eq('tag_id', tagId)
            .eq('entity_type', entityType);
          
          if (removeError) throw removeError;
          
          // For backward compatibility, also update the used_entity_types array
          const { data: tagData } = await client
            .from('tags')
            .select('used_entity_types')
            .eq('id', tagId)
            .single();
          
          if (tagData && tagData.used_entity_types) {
            const usedEntityTypes = tagData.used_entity_types as string[];
            const updatedEntityTypes = usedEntityTypes.filter(t => t !== entityType);
            
            await client
              .from('tags')
              .update({ used_entity_types: updatedEntityTypes })
              .eq('id', tagId);
          }
        }
      }
      
      return createSuccessResponse(true);
    });
  }
};
