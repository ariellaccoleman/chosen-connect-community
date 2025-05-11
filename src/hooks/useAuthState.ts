
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
          setIsAdmin(session.user.app_metadata?.role === 'admin');
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
        setIsAdmin(session?.user?.app_metadata?.role === 'admin' || false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
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
