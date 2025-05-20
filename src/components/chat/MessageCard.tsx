
import React, { useEffect } from 'react';
import { ChatMessageWithAuthor } from '@/types/chat';
import UserAvatar from '@/components/navigation/UserAvatar';
import { MessageSquare } from 'lucide-react';
import { MembershipTier, Profile } from '@/types/profile';
import { formatRelativeTime } from '@/utils/formatters';
import { logger } from '@/utils/logger';

interface MessageCardProps {
  message: ChatMessageWithAuthor;
  isSelected?: boolean;
  onClick?: () => void;
  showReplies?: boolean;
}

const MessageCard: React.FC<MessageCardProps> = ({ 
  message, 
  isSelected = false,
  onClick, 
  showReplies = true 
}) => {
  // Get the timestamp information
  const rawTimestamp = message.created_at;
  // Use the pre-formatted time from processChatMessage if available, otherwise format it here
  const formattedTime = message.formatted_time || formatRelativeTime(rawTimestamp);
  
  // Log the timezone information and timestamps once when the component renders
  useEffect(() => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    logger.info(
      `[DISPLAY] MessageCard rendering message ID: ${message.id}\n` +
      `Raw timestamp: ${rawTimestamp}\n` + 
      `User timezone: ${userTimeZone}\n` +
      `Pre-formatted time: ${message.formatted_time || 'none'}\n` +
      `Displayed time: ${formattedTime}\n` +
      `Local time now: ${new Date().toLocaleString()} (${userTimeZone})`
    );
  }, [message.id, rawTimestamp, message.formatted_time, formattedTime]);

  // Create a minimal profile object that works with UserAvatar
  const profileForAvatar: Profile | null = message.author ? {
    id: message.author.id,
    first_name: message.author.first_name,
    last_name: message.author.last_name,
    avatar_url: message.author.avatar_url,
    // Add minimal required props for UserAvatar component
    email: null,
    headline: null,
    bio: null,
    linkedin_url: null,
    twitter_url: null,
    website_url: null,
    company: null,
    created_at: '',
    updated_at: '',
    is_approved: true,
    membership_tier: 'free' as MembershipTier,
    location_id: null
  } : null;

  return (
    <div 
      className={`p-3 rounded-md ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'} 
        ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <UserAvatar 
          profile={profileForAvatar} 
          className="w-8 h-8 mt-1" 
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">
              {message.author?.full_name || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formattedTime}
            </span>
          </div>
          
          <div className="mt-1 text-sm whitespace-pre-wrap break-words">
            {message.message}
          </div>

          {showReplies && message.reply_count !== undefined && message.reply_count > 0 && (
            <div 
              className="mt-2 text-xs flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <MessageSquare size={14} className="mr-1" />
              {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCard;
