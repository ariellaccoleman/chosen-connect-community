
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

  const { state, actions } = context;
  
  return {
    // Auth state
    user: state.user,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.isAdmin,
    email: state.email,
    
    // Auth actions (from the provider)
    ...actions,
  };
}
