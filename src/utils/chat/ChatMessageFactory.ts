
import { ChatMessageWithAuthor } from '@/types/chat';
import { formatRelativeTime } from '@/utils/formatters/timeFormatters';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Factory for standardizing chat messages throughout the application
 */
export class ChatMessageFactory {
  /**
   * Create a standardized ChatMessageWithAuthor object from raw data
   */
  static createMessageWithAuthor(data: any): ChatMessageWithAuthor {
    if (!data) {
      throw new Error('Cannot create message from null or undefined data');
    }

    // Extract author data
    let author = null;
    if (data.author) {
      author = {
        id: data.author.id,
        first_name: data.author.first_name,
        last_name: data.author.last_name,
        avatar_url: data.author.avatar_url,
        // Add computed full name
        full_name: this.formatAuthorName(data.author)
      };
    }
    
    // Build the final message object
    const message: ChatMessageWithAuthor = {
      id: data.id,
      channel_id: data.channel_id,
      parent_id: data.parent_id,
      user_id: data.user_id,
      message: data.message,
      created_at: data.created_at,
      updated_at: data.updated_at || data.created_at,
      author,
      reply_count: data.reply_count || 0,
      // Add formatted time
      formatted_time: formatRelativeTime(data.created_at)
    };
    
    return message;
  }
  
  /**
   * Create a message from a Supabase realtime payload
   */
  static processRealtimeMessage(payload: RealtimePostgresChangesPayload<any>): ChatMessageWithAuthor {
    const data = payload.new;
    
    // For realtime messages, we don't have the author data yet
    // so we create a minimal message object
    const message: ChatMessageWithAuthor = {
      id: data.id,
      channel_id: data.channel_id,
      parent_id: data.parent_id,
      user_id: data.user_id,
      message: data.message,
      created_at: data.created_at,
      updated_at: data.updated_at || data.created_at,
      reply_count: 0,
      formatted_time: formatRelativeTime(data.created_at)
    };
    
    return message;
  }
  
  /**
   * Format a user's full name for display
   */
  static formatAuthorName(author: any): string {
    if (!author) return 'Unknown User';
    
    const firstName = author.first_name || '';
    const lastName = author.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return 'Anonymous';
    }
  }
}

// Export helpers for direct use
export const processChatMessage = ChatMessageFactory.processRealtimeMessage.bind(ChatMessageFactory);
export const formatAuthorName = ChatMessageFactory.formatAuthorName.bind(ChatMessageFactory);
