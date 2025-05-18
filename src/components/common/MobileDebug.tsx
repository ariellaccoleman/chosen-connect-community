
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
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
      setDebugInfo({ ...debugInfo, message: 'Auth refreshed' });
    } catch (error: any) {
      setDebugInfo({ ...debugInfo, refreshError: error.message });
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
      
      <div className="flex space-x-2 mb-2">
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
