

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

// Re-export functions from the service
export { getChannelMessages, getThreadReplies, sendChatMessage, getChannelMessagePreviews };

