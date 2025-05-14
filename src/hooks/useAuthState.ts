
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Setup the auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      
      if (session) {
        setUser(session.user);
        
        // Check for admin role in multiple places to ensure we catch it
        const hasAdminRole = 
          session.user.app_metadata?.role === 'admin' || 
          session.user.user_metadata?.role === 'admin';
        
        setIsAdmin(hasAdminRole);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    // Then check the current session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error);
        }

        if (session) {
          setUser(session.user);
          
          // Check for admin role in multiple places to ensure we catch it
          const hasAdminRole = 
            session.user.app_metadata?.role === 'admin' || 
            session.user.user_metadata?.role === 'admin';
          
          console.log("Initial session loaded:", {
            email: session.user.email,
            app_metadata: session.user.app_metadata,
            user_metadata: session.user.user_metadata,
            hasAdminRole
          });
          
          setIsAdmin(hasAdminRole);
        } else {
          console.log("No active session found");
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unexpected error occurred.'));
      } finally {
        setLoading(false);
      }
    };

    getSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    error,
    setError,
    setLoading,
    setUser,
    isAdmin,
    setIsAdmin,
  };
};
