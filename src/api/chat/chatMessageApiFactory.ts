
import { createApiFactory } from '../core/factory';
import { createRepository } from '../core/repository/repositoryFactory';
import { ChatMessageWithAuthor } from '@/types/chat';
import { ChatMessageFactory } from '@/utils/chat/ChatMessageFactory';
import { 
  getChannelMessages,
  getThreadReplies,
  sendChatMessage,
  getChannelMessagePreviews
} from './chatMessageService';

/**
 * API Factory for chat messages
 */
export const chatMessageApi = createApiFactory<ChatMessageWithAuthor, string>({
  tableName: 'chats',
  idField: 'id',
  useMutationOperations: true,
  
  // Configure repository with enhanced features
  repository: {
    type: 'supabase',
    enhanced: true,
    enableLogging: true
  },
  
  // Transform raw database response to domain type using our factory
  transformResponse: (data) => {
    // Return empty data if missing
    if (!data) return {} as ChatMessageWithAuthor;
    
    // Use the chat message factory for consistent handling
    return ChatMessageFactory.createMessageWithAuthor(data);
  }
});

/**
 * Reset chat message API with authenticated client
 */
export const resetApi = (client?: any) => {
  const newApi = createApiFactory<ChatMessageWithAuthor, string>({
    tableName: 'chats',
    idField: 'id',
    useMutationOperations: true,
    
    // Configure repository with enhanced features
    repository: {
      type: 'supabase',
      enhanced: true,
      enableLogging: true
    },
    
    // Transform raw database response to domain type using our factory
    transformResponse: (data) => {
      // Return empty data if missing
      if (!data) return {} as ChatMessageWithAuthor;
      
      // Use the chat message factory for consistent handling
      return ChatMessageFactory.createMessageWithAuthor(data);
    }
  }, client);

  return {
    getAll: newApi.getAll,
    getById: newApi.getById,
    getByIds: newApi.getByIds,
    create: newApi.create,
    update: newApi.update,
    delete: newApi.delete,
    // Re-export service functions with client parameter support
    getChannelMessages: (channelId: string, limit?: number, offset?: number) => 
      getChannelMessages(channelId, limit, offset, client),
    getThreadReplies: (messageId: string, limit?: number, offset?: number) => 
      getThreadReplies(messageId, limit, offset, client),
    sendChatMessage: (channelId: string, message: string, userId: string, parentId?: string | null) => 
      sendChatMessage(channelId, message, userId, parentId, client),
    getChannelMessagePreviews: (channelId: string) => 
      getChannelMessagePreviews(channelId, client)
  };
};

// Re-export functions from the service
export { getChannelMessages, getThreadReplies, sendChatMessage, getChannelMessagePreviews };
