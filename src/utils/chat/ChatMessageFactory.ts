
import { ChatMessage, ChatMessageWithAuthor } from '@/types/chat';
import { formatRelativeTime } from '@/utils/formatters/timeFormatters';
import { logger } from '@/utils/logger';
import { logTimestampDebugInfo } from './timeUtils';

/**
 * Chat Message Factory
 * 
 * Handles consistent creation and transformation of chat messages
 */
export class ChatMessageFactory {
  /**
   * Creates a standardized message with author from API response
   */
  static createMessageWithAuthor(message: any): ChatMessageWithAuthor {
    // Format author information if available
    const authorData = message.author ? {
      id: message.author.id,
      first_name: message.author.first_name || '',
      last_name: message.author.last_name || '',
      avatar_url: message.author.avatar_url || null,
      full_name: this.formatAuthorName(message.author)
    } : undefined;
    
    // Pre-format the timestamp consistently
    const formattedTime = formatRelativeTime(message.created_at);
    
    // Log timestamp debugging information
    logTimestampDebugInfo(message.id, message.created_at, formattedTime);
    
    // Create a standardized message object
    return {
      id: message.id,
      channel_id: message.channel_id,
      parent_id: message.parent_id,
      user_id: message.user_id,
      message: message.message,
      created_at: message.created_at,
      updated_at: message.updated_at || message.created_at,
      reply_count: message.reply_count || 0,
      formatted_time: formattedTime,
      author: authorData
    };
  }
  
  /**
   * Format author's full name consistently
   */
  static formatAuthorName(author: any): string {
    if (!author) return 'Anonymous';
    
    const firstName = author.first_name || '';
    const lastName = author.last_name || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    
    return fullName || 'Anonymous';
  }
  
  /**
   * Process a real-time message update
   * Similar to createMessageWithAuthor but handles real-time payloads
   */
  static processRealtimeMessage(payload: any): ChatMessageWithAuthor {
    if (!payload || !payload.new) {
      logger.error('[CHAT FACTORY] Invalid realtime payload received');
      return {} as ChatMessageWithAuthor;
    }
    
    const message = payload.new;
    return this.createMessageWithAuthor(message);
  }
}

// Export a simpler function for backward compatibility
export function processChatMessage(message: any, includeAuthor = true): ChatMessageWithAuthor {
  return ChatMessageFactory.createMessageWithAuthor(message);
}

// Export the author name formatter for backward compatibility
export function formatAuthorName(author: any): string {
  return ChatMessageFactory.formatAuthorName(author);
}
