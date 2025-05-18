
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useParams } from 'react-router-dom';

/**
 * Debug component for mobile devices that shows relevant information
 * and provides actions to help diagnose issues
 */
const MobileDebug = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { user } = useAuth();
  const { channelId } = useParams();
  
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  const gatherDebugInfo = async () => {
    try {
      setIsLoading(true);
      
      // Gather basic user and auth info
      const info = {
        user: user ? {
          id: user.id,
          email: user.email,
          isAuthenticated: !!user
        } : 'Not authenticated',
        channelId,
        route: window.location.pathname,
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(info);
    } catch (error) {
      setDebugInfo({ error: 'Failed to gather debug info' });
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
