
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader, Bug } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Debug component for mobile devices that shows relevant information
 * and provides actions to help diagnose issues
 */
const MobileDebug = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { user, isAuthenticated, initialized } = useAuth();
  const { channelId } = useParams();
  
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  const gatherDebugInfo = async () => {
    try {
      setIsLoading(true);
      
      // Check current session
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Check if we can do a simple query to test auth
      let queryResult;
      try {
        const { data, error } = await supabase
          .from('chat_channels')
          .select('id, name')
          .limit(1);
        
        queryResult = { success: !error, data: data?.length, error: error?.message };
      } catch (queryError: any) {
        queryResult = { success: false, error: queryError.message };
      }
      
      // Test querying the current channel
      let channelResult;
      if (channelId) {
        try {
          const { data, error } = await supabase
            .from('chat_channels')
            .select('*')
            .eq('id', channelId)
            .single();
          
          channelResult = { 
            success: !error, 
            exists: !!data, 
            data: data ? { name: data.name, is_public: data.is_public } : null,
            error: error?.message 
          };
        } catch (channelError: any) {
          channelResult = { success: false, error: channelError.message };
        }
      }
      
      // Test querying messages
      let messagesResult;
      if (channelId) {
        try {
          const { data, error } = await supabase
            .from('chats')
            .select('id')
            .eq('channel_id', channelId)
            .limit(5);
          
          messagesResult = { 
            success: !error, 
            count: data?.length || 0,
            error: error?.message 
          };
        } catch (messagesError: any) {
          messagesResult = { success: false, error: messagesError.message };
        }
      }
      
      // Gather basic user and auth info
      const info = {
        auth: {
          isAuthenticated,
          initialized,
          hasUser: !!user,
          userId: user?.id,
          email: user?.email,
          sessionExists: !!sessionData.session,
          sessionUserId: sessionData.session?.user?.id,
        },
        chat: {
          channelId,
          channelInfo: channelResult,
          messages: messagesResult,
          queryTest: queryResult
        },
        route: window.location.pathname,
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(info);
    } catch (error: any) {
      setDebugInfo({ error: `Failed to gather debug info: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.refreshSession();
      await gatherDebugInfo();
    } catch (error: any) {
      setDebugInfo({ ...debugInfo, refreshError: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testSendMessage = async () => {
    if (!channelId || !user?.id) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('chats')
        .insert({
          channel_id: channelId,
          user_id: user.id,
          message: "Debug test message"
        })
        .select();
      
      setDebugInfo({
        ...debugInfo,
        testMessage: {
          success: !error,
          data: data ? { id: data[0]?.id } : null,
          error: error?.message
        }
      });
    } catch (error: any) {
      setDebugInfo({
        ...debugInfo,
        testMessage: {
          success: false,
          error: error.message
        }
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isVisible) {
    return (
      <Button 
        className="fixed top-20 right-2 bg-gray-100 text-gray-800 p-1 text-xs"
        size="sm"
        variant="ghost"
        onClick={toggleVisibility}
      >
        <Bug size={12} className="mr-1" />
        Debug
      </Button>
    );
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 max-h-60 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold">Mobile Debug Panel</h3>
        <Button size="sm" variant="ghost" onClick={toggleVisibility}>Close</Button>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={gatherDebugInfo}
          disabled={isLoading}
        >
          {isLoading && <Loader size={12} className="mr-1 animate-spin" />}
          Get Info
        </Button>

        <Button 
          size="sm" 
          variant="outline" 
          onClick={refreshAuth}
          disabled={isLoading}
        >
          {isLoading && <Loader size={12} className="mr-1 animate-spin" />}
          Refresh Auth
        </Button>

        <Button 
          size="sm" 
          variant="outline" 
          onClick={testSendMessage}
          disabled={isLoading || !channelId}
        >
          {isLoading && <Loader size={12} className="mr-1 animate-spin" />}
          Test Message
        </Button>
      </div>
      
      {debugInfo && (
        <div className="text-xs bg-gray-800 p-2 rounded">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default MobileDebug;
