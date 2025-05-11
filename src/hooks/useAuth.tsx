
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ user: User | null } | undefined>;
  logout: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>; // Alias for login
  signOut: () => Promise<void>; // Alias for logout
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const value: AuthContextType = {
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Import toast
import { toast } from "@/components/ui/sonner";
