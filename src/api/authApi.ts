
import { User } from "@supabase/supabase-js";
import { apiClient } from "./core/apiClient";
import { ApiResponse, createSuccessResponse } from "./core/errorHandler";

interface AuthSignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface AuthLoginData {
  email: string;
  password: string;
}

interface AuthResetPasswordData {
  email: string;
}

interface AuthUpdatePasswordData {
  password: string;
}

/**
 * API module for authentication operations
 */
export const authApi = {
  /**
   * Sign up a new user
   */
  async signUp(data: AuthSignUpData): Promise<ApiResponse<{ user: User | null }>> {
    return apiClient.authQuery(async (auth) => {
      const metadata: { [key: string]: any } = {};
      if (data.firstName) metadata.first_name = data.firstName;
      if (data.lastName) metadata.last_name = data.lastName;

      const { data: authData, error } = await auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: metadata,
        },
      });
      
      if (error) throw error;
      
      return createSuccessResponse({ user: authData.user });
    });
  },
  
  /**
   * Sign in a user
   */
  async login(data: AuthLoginData): Promise<ApiResponse<{ user: User | null }>> {
    return apiClient.authQuery(async (auth) => {
      const { data: authData, error } = await auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) throw error;
      
      return createSuccessResponse({ user: authData.user });
    });
  },
  
  /**
   * Sign out the current user
   */
  async logout(): Promise<ApiResponse<boolean>> {
    return apiClient.authQuery(async (auth) => {
      // Debug logging to help troubleshoot
      console.log("Attempting to sign out");
      
      try {
        const { error } = await auth.signOut();
        
        if (error) {
          console.error("Sign out error:", error);
          throw error;
        }
        
        console.log("Sign out successful");
        return createSuccessResponse(true);
      } catch (err) {
        console.error("Sign out exception:", err);
        throw err;
      }
    });
  },
  
  /**
   * Get the current authenticated session
   */
  async getSession(): Promise<ApiResponse<{ user: User | null }>> {
    return apiClient.authQuery(async (auth) => {
      const { data: { session }, error } = await auth.getSession();
      
      if (error) throw error;
      
      return createSuccessResponse({ user: session?.user || null });
    });
  },
  
  /**
   * Request a password reset email
   */
  async resetPasswordRequest(data: AuthResetPasswordData): Promise<ApiResponse<boolean>> {
    return apiClient.authQuery(async (auth) => {
      const { error } = await auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) throw error;
      
      return createSuccessResponse(true);
    });
  },
  
  /**
   * Update password (after reset or for logged in user)
   */
  async updatePassword(data: AuthUpdatePasswordData): Promise<ApiResponse<boolean>> {
    return apiClient.authQuery(async (auth) => {
      const { error } = await auth.updateUser({
        password: data.password,
      });
      
      if (error) throw error;
      
      return createSuccessResponse(true);
    });
  }
};
