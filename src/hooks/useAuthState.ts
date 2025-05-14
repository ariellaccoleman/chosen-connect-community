
import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/sonner";

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
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
          
          console.log("Auth state - User session loaded:", {
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

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null);
        
        // Check both metadata locations for admin role
        const hasAdminRole = 
          session?.user?.app_metadata?.role === 'admin' ||
          session?.user?.user_metadata?.role === 'admin';
          
        console.log("Auth state changed - SIGNED_IN:", { 
          email: session?.user?.email,
          app_metadata: session?.user?.app_metadata,
          user_metadata: session?.user?.user_metadata,
          hasAdminRole
        });
        
        setIsAdmin(hasAdminRole);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        console.log("Auth state changed - SIGNED_OUT");
      }
    });
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
