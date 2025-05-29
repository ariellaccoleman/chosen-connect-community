
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";

/**
 * Chat message service with client injection support
 */
export const chatMessageService = {
  /**
   * Get messages for a channel
   */
  async getChannelMessages(channelId: string, providedClient?: any): Promise<ApiResponse<any[]>> {
    return apiClient.query(async (client) => {
      const { data, error } = await client
        .from('chats')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return createSuccessResponse(data || []);
    }, providedClient);
  },

  /**
   * Send a message
   */
  async sendMessage(messageData: any, providedClient?: any): Promise<ApiResponse<any>> {
    return apiClient.query(async (client) => {
      const { data, error } = await client
        .from('chats')
        .insert(messageData)
        .select()
        .single();
      
      if (error) throw error;
      return createSuccessResponse(data);
    }, providedClient);
  },

  /**
   * Update a message
   */
  async updateMessage(messageId: string, updateData: any, providedClient?: any): Promise<ApiResponse<any>> {
    return apiClient.query(async (client) => {
      const { data, error } = await client
        .from('chats')
        .update(updateData)
        .eq('id', messageId)
        .select()
        .single();
      
      if (error) throw error;
      return createSuccessResponse(data);
    }, providedClient);
  },

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, providedClient?: any): Promise<ApiResponse<boolean>> {
    return apiClient.query(async (client) => {
      const { error } = await client
        .from('chats')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
      return createSuccessResponse(true);
    }, providedClient);
  }
};
