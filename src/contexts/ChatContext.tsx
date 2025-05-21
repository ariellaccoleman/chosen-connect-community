
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChatMessageWithAuthor, ChatChannel } from '@/types/chat';
import { useChat } from '@/hooks/chat/useChat';
import { useChannelMessagesRealtime, useThreadRepliesRealtime } from '@/hooks/chat/useChatRealtime';
import { useChannelMessages, useThreadMessages } from '@/hooks/chat/useChatMessageFactory';

interface ChatContextType {
  channelId: string | null;
  activeChannel: ChatChannel | null;
  selectedMessage: ChatMessageWithAuthor | null;
  isThreadOpen: boolean;
  messages: ChatMessageWithAuthor[];
  threadMessages: ChatMessageWithAuthor[];
  messagesLoading: boolean;
  threadMessagesLoading: boolean;
  messagesError: unknown;
  threadMessagesError: unknown;
  setSelectedMessage: (message: ChatMessageWithAuthor | null) => void;
  toggleThread: (open?: boolean) => void;
  autoScrollMessages: boolean;
  setAutoScrollMessages: (value: boolean) => void;
  autoScrollThread: boolean;
  setAutoScrollThread: (value: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { channelId, activeChannel } = useChat();
  const [selectedMessage, setSelectedMessage] = useState<ChatMessageWithAuthor | null>(null);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [autoScrollMessages, setAutoScrollMessages] = useState(true);
  const [autoScrollThread, setAutoScrollThread] = useState(true);
  
  // Setup message queries
  const channelMessagesQuery = useChannelMessages(channelId);
  const threadMessagesQuery = useThreadMessages(selectedMessage?.id);
  
  // Setup real-time subscriptions
  useChannelMessagesRealtime(channelId);
  useThreadRepliesRealtime(selectedMessage?.id);
  
  // Helper to toggle thread visibility
  const toggleThread = (open?: boolean) => {
    if (open !== undefined) {
      setIsThreadOpen(open);
    } else {
      setIsThreadOpen(!isThreadOpen);
    }
    
    if (!isThreadOpen && !open) {
      setSelectedMessage(null);
    }
  };
  
  // Extract data and states from queries
  const messages = channelMessagesQuery.data || [];
  const threadMessages = threadMessagesQuery.data || [];
  
  const value: ChatContextType = {
    channelId,
    activeChannel,
    selectedMessage,
    isThreadOpen,
    messages,
    threadMessages,
    messagesLoading: channelMessagesQuery.isLoading,
    threadMessagesLoading: threadMessagesQuery.isLoading,
    messagesError: channelMessagesQuery.error,
    threadMessagesError: threadMessagesQuery.error,
    setSelectedMessage,
    toggleThread,
    autoScrollMessages,
    setAutoScrollMessages,
    autoScrollThread,
    setAutoScrollThread
  };
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
