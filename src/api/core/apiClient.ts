
import { supabase } from "@/integrations/supabase/client";
import { handleApiError } from "./errorHandler";

/**
 * Core API client that wraps Supabase client with error handling
 * This is a lightweight wrapper that provides consistent error handling
 */
export const apiClient = {
  // Database operations with error handling
  async query(callback: (client: typeof supabase) => any) {
    try {
      return await callback(supabase);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Auth operations with error handling
  async authQuery(callback: (auth: typeof supabase.auth) => any) {
    try {
      return await callback(supabase.auth);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Storage operations with error handling
  async storageQuery(callback: (storage: typeof supabase.storage) => any) {
    try {
      return await callback(supabase.storage);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Edge function calls with error handling
  async functionQuery(callback: (functions: typeof supabase.functions) => any) {
    try {
      return await callback(supabase.functions);
    } catch (error) {
      return handleApiError(error);
    }
  }
};
