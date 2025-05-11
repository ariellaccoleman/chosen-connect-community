
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
  } = {}): Promise<ApiResponse<Tag[]>> {
    return apiClient.query(async (client) => {
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
          created_by: tagData.created_by
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
      const { data, error } = await client
        .from('tags')
        .update(updates)
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
      
      return createSuccessResponse(data);
    });
  },
  
  /**
   * Remove a tag assignment
   */
  async removeTagAssignment(assignmentId: string): Promise<ApiResponse<boolean>> {
    return apiClient.query(async (client) => {
      const { error } = await client
        .from('tag_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      
      return createSuccessResponse(true);
    });
  }
};
