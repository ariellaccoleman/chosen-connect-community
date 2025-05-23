
import { ReactNode, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthContext } from '@/contexts/AuthContext';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const {
    user,
    loading,
    error,
    setError,
    setLoading,
    setUser,
    isAdmin,
    setIsAdmin,
    initialized,
  } = useAuthState();

  const {
    login,
    signUp,
    logout,
    signIn,
    signOut,
    forgotPassword,
    resetPassword,
  } = useAuthActions({
    setLoading,
    setError,
    setUser,
    setIsAdmin,
  });

  // Adding debug console log to track auth state
  console.log("AuthProvider state:", { 
    isAuthenticated: !!user, 
    isAdmin, 
    loading, 
    initialized,
    email: user?.email
  });

  const value = {
    user,
    login,
    signUp,
    logout,
    signIn,
    signOut,
    forgotPassword,
    resetPassword,
    loading,
    error,
    isAdmin,
    initialized, // Include initialized in the context
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
