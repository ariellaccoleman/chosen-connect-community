
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatSidebar from '@/components/chat/ChatSidebar';
import MessageFeed from '@/components/chat/MessageFeed';
import ThreadPanel from '@/components/chat/ThreadPanel';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { ChatProvider, useChatContext } from '@/contexts/ChatContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Helper function to validate if a string is a valid UUID
 */
const isValidChannelId = (id: string | null | undefined): boolean => {
  if (!id || id === 'null' || id === 'undefined') return false;

  // Basic UUID validation regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Wrapper component that uses ChatContext
const ChatContent = () => {
  const { isThreadOpen, selectedMessage } = useChatContext();
  const { channelId } = useParams<{ channelId: string }>();
  const isMobile = useIsMobile();
  
  return (
    <>
      {/* Main Message Area */}
      <div className={`flex-1 flex flex-col overflow-hidden h-full ${isMobile && isThreadOpen ? 'hidden' : ''}`}>
        {isValidChannelId(channelId) ? (
          <MessageFeed />
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
        <div className={`${isMobile ? 'w-full' : 'hidden md:flex w-80 lg:w-96'} border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex-col overflow-hidden h-full`}>
          <ThreadPanel />
        </div>
      )}
    </>
  );
};

// Mobile sidebar as a sheet
const MobileSidebar = ({ selectedChannelId, onSelectChannel }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden mb-2 ml-2 mt-2">
          Channels
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[280px] p-0">
        <div className="w-full h-full bg-white dark:bg-sidebar overflow-y-auto">
          <ChatSidebar selectedChannelId={selectedChannelId} onSelectChannel={onSelectChannel} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Authentication and setup component - doesn't use ChatContext
const ChatPageContent = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, initialized } = useAuth();
  const isMobile = useIsMobile();
  
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
  
  // If authentication is still initializing, show a loading state
  if (!initialized) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
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
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            You need to be logged in to access the chat functionality.
          </p>
          <Button onClick={() => navigate('/auth')} size="lg">
            Log In / Sign Up
          </Button>
        </div>
      </div>
    );
  }
  
  const handleChannelSelect = (newChannelId: string) => {
    // Validate the channel ID before setting it
    if (!isValidChannelId(newChannelId)) {
      logger.error(`Invalid channel ID selected: ${newChannelId}`);
      toast.error('Invalid channel selected');
      return;
    }

    logger.info(`Selected channel: ${newChannelId}, navigating to chat/${newChannelId}`);
    navigate(`/chat/${newChannelId}`);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col sm:flex-row bg-gray-50 dark:bg-gray-900">
      {/* Mobile Channel Sheet */}
      {isMobile && (
        <MobileSidebar selectedChannelId={channelId || null} onSelectChannel={handleChannelSelect} />
      )}
      
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="hidden sm:flex sm:w-64 md:w-72 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-sidebar overflow-y-auto h-full">
          <ChatSidebar selectedChannelId={channelId || null} onSelectChannel={handleChannelSelect} />
        </div>
      )}
      
      {/* Only render chat content if authenticated */}
      {isAuthenticated && (
        <div className="flex flex-1 flex-col sm:flex-row h-full overflow-hidden">
          <ChatProvider>
            <ChatContent />
          </ChatProvider>
        </div>
      )}
    </div>
  );
};

const ChatPage = () => {
  return (
    <ErrorBoundary name="ChatPage">
      <ChatPageContent />
    </ErrorBoundary>
  );
};

export default ChatPage;
