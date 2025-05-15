
import { PostgrestError } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";

/**
 * Types of API errors that can occur
 */
export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
  original?: unknown;
};

/**
 * Standardized response type for all API calls
 */
export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
  status: 'success' | 'error';
};

/**
 * Create a standardized error response
 */
export const createErrorResponse = (error: any): ApiResponse<any> => {
  const apiError: ApiError = {
    code: error?.code || 'unknown_error',
    message: error?.message || 'An unknown error occurred',
    details: error?.details || null,
    original: error
  };
  
  return {
    data: null,
    error: apiError,
    status: 'error'
  };
};

/**
 * Create a standardized success response
 */
export const createSuccessResponse = <T>(data: T): ApiResponse<T> => {
  return {
    data,
    error: null,
    status: 'success'
  };
};

/**
 * Handle API errors and standardize them
 */
export const handleApiError = (error: unknown): ApiResponse<any> => {
  console.error("API Error:", error);
  
  // Handle PostgreSQL/Supabase specific errors
  if ((error as PostgrestError)?.code) {
    const pgError = error as PostgrestError;
    return createErrorResponse({
      code: pgError.code,
      message: pgError.message,
      details: pgError.details
    });
  }
  
  // Handle general errors
  const generalError = error instanceof Error 
    ? error 
    : new Error(String(error));
  
  return createErrorResponse({
    code: 'general_error',
    message: generalError.message
  });
};

/**
 * Display error toast based on API error
 */
export const showErrorToast = (error: ApiError) => {
  toast.error(error.message || 'An error occurred');
};
