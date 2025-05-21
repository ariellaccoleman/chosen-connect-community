
import React from 'react';
import { formatRelativeTime } from '@/utils/formatters';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '@/config/routes';

interface ChannelPreviewProps {
  id: string;
  name: string;
  description?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isActive?: boolean;
  onClick?: () => void;
}

const ChannelPreview: React.FC<ChannelPreviewProps> = ({
  id,
  name,
  description,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  isActive = false,
  onClick,
}) => {
  return (
    <Link
      to={`${APP_ROUTES.CHAT}/${id}`}
      className={`block p-3 rounded-lg mb-2 transition-colors ${
        isActive ? 'bg-accent' : 'hover:bg-accent/50'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{name}</h3>
          {description && (
            <p className="text-muted-foreground text-xs truncate">{description}</p>
          )}
          {lastMessage && (
            <p className="text-sm truncate mt-1 text-muted-foreground">
              {lastMessage}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end ml-2">
          {lastMessageTime && (
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(new Date(lastMessageTime).getTime())}
            </span>
          )}
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 mt-1">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ChannelPreview;
