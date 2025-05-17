
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

/**
 * Custom hook to access authentication state and methods
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return {
    user: context.user,
    loading: context.loading,
    isAuthenticated: !!context.user,
    isAdmin: context.isAdmin,
    email: context.user?.email,
    
    // Auth actions
    login: context.login,
    signUp: context.signUp,
    logout: context.logout,
    signIn: context.signIn,
    signOut: context.signOut,
    forgotPassword: context.forgotPassword,
    resetPassword: context.resetPassword,
    error: context.error
  };
}
