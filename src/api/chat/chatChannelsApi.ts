
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";

/**
 * Chat channels API with client injection support
 */
export const chatChannelsApi = {
  /**
   * Get all chat channels
   */
  async getAllChannels(providedClient?: any): Promise<ApiResponse<any[]>> {
    return apiClient.query(async (client) => {
      const { data, error } = await client
        .from('chat_channels')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return createSuccessResponse(data || []);
    }, providedClient);
  },

  /**
   * Create a new chat channel
   */
  async createChannel(channelData: any, providedClient?: any): Promise<ApiResponse<any>> {
    return apiClient.query(async (client) => {
      const { data, error } = await client
        .from('chat_channels')
        .insert(channelData)
        .select()
        .single();
      
      if (error) throw error;
      return createSuccessResponse(data);
    }, providedClient);
  },

  /**
   * Update a chat channel
   */
  async updateChannel(id: string, updateData: any, providedClient?: any): Promise<ApiResponse<any>> {
    return apiClient.query(async (client) => {
      const { data, error } = await client
        .from('chat_channels')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return createSuccessResponse(data);
    }, providedClient);
  }
};
