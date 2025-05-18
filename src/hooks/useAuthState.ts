import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    
    console.log("🔐 Auth state initialization starting...");
    
    const setupAuthListener = () => {
      // Important: Always create the listener BEFORE checking the session
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("🔄 Auth state changed:", event, session?.user?.email);
        
        if (!mounted) return;
        
        // Process auth state change
        if (session) {
          const hasAdminRole = 
            session.user.app_metadata?.role === 'admin' || 
            session.user.user_metadata?.role === 'admin';
          
          console.log("👤 User authenticated:", {
            email: session.user.email,
            hasAdminRole,
            token: session.access_token ? "✓" : "✗"
          });
          
          setUser(session.user);
          setIsAdmin(hasAdminRole);
        } else {
          console.log("👤 No authenticated user");
          setUser(null);
          setIsAdmin(false);
        }
        
        // Only update initialized if we haven't checked the session yet
        if (!sessionChecked && mounted) {
          console.log("✅ Auth state initialized via event");
          setInitialized(true);
          setLoading(false);
          setSessionChecked(true);
        }
      });

      return { subscription };
    };

    // Retrieve the current session
    const getSession = async () => {
      try {
        console.log("🔍 Checking for existing session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error("❌ Session error:", error);
          setError(error);
        }

        if (session) {
          const hasAdminRole = 
            session.user.app_metadata?.role === 'admin' || 
            session.user.user_metadata?.role === 'admin';
          
          console.log("✅ Found existing session:", {
            email: session.user.email,
            app_metadata: session.user.app_metadata,
            user_metadata: session.user.user_metadata,
            hasAdminRole,
            token: session.access_token ? "✓" : "✗"
          });
          
          setUser(session.user);
          setIsAdmin(hasAdminRole);
        } else {
          console.log("ℹ️ No existing session found");
          setUser(null);
          setIsAdmin(false);
        }
        
        // Always update these states to indicate initialization is complete
        if (!sessionChecked && mounted) {
          console.log("✅ Auth state initialized via getSession");
          setInitialized(true);
          setLoading(false);
          setSessionChecked(true);
        }
      } catch (err) {
        console.error("❌ Session retrieval error:", err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('An unexpected error occurred.'));
          
          if (!sessionChecked) {
            setInitialized(true);
            setLoading(false);
            setSessionChecked(true);
          }
        }
      }
    };

    // Setup auth listener first
    authListener = setupAuthListener();
    
    // Then check for existing session
    getSession();

    return () => {
      console.log("🔒 Auth state cleanup - unsubscribing");
      mounted = false;
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [sessionChecked]); // Add sessionChecked to dependencies

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
