
import { useEffect, useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          },
          emailRedirectTo: `${window.location.origin}/auth` // Use the dynamic origin for redirect
        }
      });
      
      if (error) throw error;
      
      // Send custom confirmation email
      try {
        // Make sure to use the fully qualified URL with the protocol
        const confirmationURL = `${window.location.origin}/auth?confirmation=true`;
        console.log("Sending confirmation email with URL:", confirmationURL);
        
        await supabase.functions.invoke('custom-email', {
          body: {
            type: 'confirmation',
            email: email,
            actionLink: confirmationURL,
            additionalData: { firstName }
          }
        });
        console.log("Custom email function called successfully");
      } catch (emailError) {
        console.error("Error sending custom confirmation email:", emailError);
        // Continue with signup even if custom email fails
      }
      
      toast.success("Sign up successful. Please check your email for verification.");
    } catch (error: any) {
      toast.error(error.message || "An error occurred during sign up");
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      navigate('/dashboard');
      toast.success("Successfully signed in");
    } catch (error: any) {
      toast.error(error.message || "Invalid login credentials");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
      toast.success("Successfully signed out");
    } catch (error: any) {
      toast.error(error.message || "Error signing out");
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) throw error;
      
      // Send custom password reset email
      try {
        const resetURL = `${window.location.origin}/auth?reset=true`;
        await supabase.functions.invoke('custom-email', {
          body: {
            type: 'reset_password',
            email: email,
            actionLink: resetURL
          }
        });
      } catch (emailError) {
        console.error("Error sending custom password reset email:", emailError);
        // Continue with reset flow even if custom email fails
      }
      
      toast.success("Please check your email for password reset instructions");
    } catch (error: any) {
      toast.error(error.message || "Error requesting password reset");
      throw error;
    }
  };

  const resetPassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      toast.success("Password has been successfully reset");
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message || "Error resetting password");
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signUp, 
      signIn, 
      signOut,
      forgotPassword,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
