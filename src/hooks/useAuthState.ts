
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Setup the auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      
      if (!mounted) return;
      
      if (session) {
        // Check for admin role in multiple places to ensure we catch it
        const hasAdminRole = 
          session.user.app_metadata?.role === 'admin' || 
          session.user.user_metadata?.role === 'admin';
        
        if (mounted) {
          setUser(session.user);
          setIsAdmin(hasAdminRole);
          setLoading(false);
          setInitialized(true);
        }
      } else {
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          setInitialized(true);
        }
      }
    });

    // Then check the current session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          setError(error);
        }

        if (session) {
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
          
          setUser(session.user);
          setIsAdmin(hasAdminRole);
        } else {
          console.log("No active session found");
        }
        
        // Always set initialized to true once we've checked for a session,
        // regardless of whether we found one or not
        setInitialized(true);
        setLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('An unexpected error occurred.'));
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    getSession();

    return () => {
      mounted = false;
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
    initialized,
  };
};
