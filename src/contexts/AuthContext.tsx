
import { User } from '@supabase/supabase-js';
import { createContext, useContext } from 'react';

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
  initialized: boolean; // Add initialized property
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
