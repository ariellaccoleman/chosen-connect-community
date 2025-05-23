
import React from 'react';
import { ChatMessageWithAuthor } from '@/types/chat';
import UserAvatar from '@/components/navigation/UserAvatar';
import { MessageSquare } from 'lucide-react';
import { MembershipTier, Profile } from '@/types/profile';
import { formatRelativeTime } from '@/utils/formatters/timeFormatters';
import { EntityType } from '@/types/entityTypes';

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
  // Use the pre-formatted time from the message if available, otherwise format it here
  const formattedTime = message.formatted_time || formatRelativeTime(message.created_at);

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
    location_id: null,
    // Add Entity required fields
    entityType: EntityType.PERSON,
    name: `${message.author.first_name} ${message.author.last_name}`,
    full_name: `${message.author.first_name} ${message.author.last_name}`
  } : null;

  // Add clear visual indication that the message is clickable when onClick is provided
  const cursorClass = onClick ? 'cursor-pointer' : '';
  const hoverClass = onClick ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : '';
  const selectedClass = isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : '';

  return (
    <div 
      className={`p-3 rounded-md transition-colors ${selectedClass} ${hoverClass} ${cursorClass}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-selected={isSelected}
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
          
          {onClick && !message.reply_count && (
            <div className="mt-2 text-xs flex items-center text-gray-500 dark:text-gray-400">
              <MessageSquare size={14} className="mr-1" />
              Reply in thread
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCard;
