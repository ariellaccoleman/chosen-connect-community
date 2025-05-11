
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from "@/components/ui/sonner";

interface UseAuthActionsProps {
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setUser: (user: User | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
}

export const useAuthActions = ({
  setLoading,
  setError,
  setUser,
  setIsAdmin,
}: UseAuthActionsProps) => {
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error);
      } else {
        setUser(data.user);
        setIsAdmin(data.user?.app_metadata?.role === 'admin');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unexpected error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const metadata: { [key: string]: any } = {};
      if (firstName) metadata.first_name = firstName;
      if (lastName) metadata.last_name = lastName;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        setError(error);
        return undefined;
      } else {
        setUser(data.user);
        setIsAdmin(data.user?.app_metadata?.role === 'admin');
        navigate('/dashboard');
        return { user: data.user };
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unexpected error occurred.'));
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error);
      } else {
        setUser(null);
        setIsAdmin(false);
        navigate('/auth');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unexpected error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  // Add forgotPassword function
  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) {
        setError(error);
      } else {
        toast.success("Password reset instructions have been sent to your email");
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unexpected error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  // Add resetPassword function
  const resetPassword = async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) {
        setError(error);
      } else {
        toast.success("Password has been updated successfully");
        navigate('/auth');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unexpected error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  // Create alias functions to maintain compatibility
  const signIn = login;
  const signOut = logout;

  return {
    login,
    signUp,
    logout,
    signIn,
    signOut,
    forgotPassword,
    resetPassword,
  };
};
