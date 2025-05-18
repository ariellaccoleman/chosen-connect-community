
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatSidebar from '@/components/chat/ChatSidebar';
import MessageFeed from '@/components/chat/MessageFeed';
import ThreadPanel from '@/components/chat/ThreadPanel';
import { logger } from '@/utils/logger';
import { useChannelMessagesRealtime } from '@/hooks/chat';
import { ChatMessageWithAuthor } from '@/types/chat';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Helper function to validate if a string is a valid UUID
 */
const isValidChannelId = (id: string | null | undefined): boolean => {
  if (!id || id === 'null' || id === 'undefined') return false;
  
  // Basic UUID validation regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const ChatPage = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const [selectedMessage, setSelectedMessage] = useState<ChatMessageWithAuthor | null>(null);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const { user, isAuthenticated, initialized } = useAuth();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(
    isValidChannelId(channelId) ? channelId : null
  );

  // Enhanced logging for debugging channel selection
  useEffect(() => {
    logger.info(`Chat page mounted/updated`);
    logger.info(`Channel ID from URL params: ${channelId || 'none'} (type: ${typeof channelId}, valid: ${isValidChannelId(channelId)})`);
    logger.info(`Active channel ID in state: ${activeChannelId || 'none'} (type: ${typeof activeChannelId}, valid: ${isValidChannelId(activeChannelId)})`);
    
    // Update active channel ID when URL param changes and is valid
    if (channelId && isValidChannelId(channelId) && channelId !== activeChannelId) {
      logger.info(`Updating active channel ID to match URL param: ${channelId}`);
      setActiveChannelId(channelId);
    }
  }, [channelId, activeChannelId]);

  // Authentication check
  useEffect(() => {
    logger.info(`Authentication state: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
    logger.info(`User ID: ${user?.id || 'Not available'}`);
    
    if (!isAuthenticated && initialized) {
      logger.warn('User is not authenticated, redirecting to auth page');
      toast.error('You must be logged in to access chat');
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, user, initialized, navigate]);

  // Setup real-time updates only for valid channel IDs
  useChannelMessagesRealtime(isValidChannelId(activeChannelId) ? activeChannelId : null);

  const handleChannelSelect = (newChannelId: string) => {
    // Validate the channel ID before setting it
    if (!isValidChannelId(newChannelId)) {
      logger.error(`Invalid channel ID selected: ${newChannelId}`);
      toast.error('Invalid channel selected');
      return;
    }
    
    // Close thread panel when changing channels
    setSelectedMessage(null);
    setIsThreadOpen(false);
    
    logger.info(`Selected channel: ${newChannelId}, navigating to chat/${newChannelId}`);
    setActiveChannelId(newChannelId); // Update our local state immediately
    navigate(`/chat/${newChannelId}`);
  };

  const handleMessageSelect = (message: ChatMessageWithAuthor) => {
    setSelectedMessage(message);
    setIsThreadOpen(true);
    logger.info('Selected message for thread:', message.id);
  };

  const handleCloseThread = () => {
    setIsThreadOpen(false);
  };

  // If authentication is still initializing, show a loading state
  if (!initialized) {
    return (
      <div className="h-[calc(100vh-64px)] pt-16 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader size={36} className="mx-auto animate-spin text-primary mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated but initialization is complete, show login prompt
  if (!isAuthenticated && initialized) {
    return (
      <div className="h-[calc(100vh-64px)] pt-16 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">You need to be logged in to access the chat functionality.</p>
          <Button onClick={() => navigate('/auth')} size="lg">
            Log In / Sign Up
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] pt-16 flex flex-col sm:flex-row bg-gray-50 dark:bg-gray-900">
      {/* Channel Sidebar */}
      <div className="w-full sm:w-64 md:w-72 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-sidebar overflow-y-auto">
        <ChatSidebar 
          selectedChannelId={activeChannelId} 
          onSelectChannel={handleChannelSelect} 
        />
      </div>
      
      {/* Main Message Area */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isThreadOpen ? 'hidden md:flex' : ''}`}>
        {isValidChannelId(activeChannelId) ? (
          <MessageFeed 
            channelId={activeChannelId}
            onMessageSelect={handleMessageSelect}
            selectedMessageId={selectedMessage?.id}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center bg-white dark:bg-gray-800">
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                Select a channel to start chatting
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose a channel from the sidebar
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Thread Panel (conditional) */}
      {isThreadOpen && selectedMessage && (
        <div className="w-full md:w-80 lg:w-96 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
          <ThreadPanel 
            parentMessage={selectedMessage}
            channelId={activeChannelId || ''}
            onClose={handleCloseThread}
          />
        </div>
      )}
    </div>
  );
};

const Chat = () => {
  return (
    <ErrorBoundary name="ChatPage">
      <ChatPage />
    </ErrorBoundary>
  );
};

export default Chat;
