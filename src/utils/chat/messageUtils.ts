
import { ChatMessage, ChatMessageWithAuthor } from '@/types/chat';
import { formatRelativeTime } from '@/utils/formatters/timeFormatters';
import { logger } from '@/utils/logger';

/**
 * Standardized function to process chat message timestamps consistently
 * across both API responses and real-time updates
 */
export function processChatMessage(message: any, includeAuthor = true): ChatMessageWithAuthor {
  // Capture the source of the call for debugging
  const callerInfo = new Error().stack?.split('\n')[2] || 'unknown';
  
  // Log the incoming message with source information
  logger.info(`[CODE PATH] processChatMessage called from: ${callerInfo}`);
  logger.info(`[MESSAGE] Processing message ID: ${message.id}, raw timestamp: ${message.created_at}`);

  // Format author information if available
  const authorData = message.author ? {
    id: message.author.id,
    first_name: message.author.first_name || '',
    last_name: message.author.last_name || '',
    avatar_url: message.author.avatar_url || null,
    full_name: formatAuthorName(message.author)
  } : undefined;

  // Pre-format the timestamp consistently for all messages
  const formattedTime = formatRelativeTime(message.created_at);
  logger.info(`[TIMESTAMP] Pre-formatted time for message ${message.id}: ${formattedTime}`);

  // Create a standardized message object with consistent timestamp handling
  const processedMessage: ChatMessageWithAuthor = {
    id: message.id,
    channel_id: message.channel_id,
    parent_id: message.parent_id,
    user_id: message.user_id,
    message: message.message,
    created_at: message.created_at,
    updated_at: message.updated_at || message.created_at,
    reply_count: message.reply_count || 0,
    formatted_time: formattedTime, // Add the pre-formatted timestamp
    // Only include author if requested and available
    ...(includeAuthor && { author: authorData })
  };

  // Log the processed message
  logger.info(`[PROCESSED] Message: ${processedMessage.id}, raw timestamp: ${processedMessage.created_at}, formatted: ${processedMessage.formatted_time}`);
  
  return processedMessage;
}

/**
 * Format author's full name consistently
 */
export function formatAuthorName(author: any): string {
  if (!author) return 'Anonymous';
  
  const firstName = author.first_name || '';
  const lastName = author.last_name || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  
  return fullName || 'Anonymous';
}
