
import { PostgrestError } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";
import { extractErrorMessage, createErrorObject } from "@/utils/errorUtils";
import { logger } from "@/utils/logger";

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
  isSuccess: () => boolean;
  isError: () => boolean;
};

/**
 * Create a standardized error response with helper methods
 */
export const createErrorResponse = (error: unknown): ApiResponse<any> => {
  const errorObj = createErrorObject(error);
  
  const apiError: ApiError = {
    code: errorObj.code || 'unknown_error',
    message: errorObj.message,
    details: errorObj.details || null,
    original: errorObj.original
  };
  
  return {
    data: null,
    error: apiError,
    status: 'error',
    isSuccess: () => false,
    isError: () => true
  };
};

/**
 * Create a standardized success response with helper methods
 */
export const createSuccessResponse = <T>(data: T): ApiResponse<T> => {
  return {
    data,
    error: null,
    status: 'success',
    isSuccess: () => true,
    isError: () => false
  };
};

/**
 * Handle API errors and standardize them
 */
export const handleApiError = (error: unknown, context = 'API Error'): ApiResponse<any> => {
  logger.error(`${context}:`, error);
  
  // Handle PostgreSQL/Supabase specific errors
  if ((error as PostgrestError)?.code) {
    const pgError = error as PostgrestError;
    return createErrorResponse({
      code: pgError.code,
      message: pgError.message,
      details: pgError.details
    });
  }
  
  // Use our centralized error handling for all other errors
  return createErrorResponse(error);
};

/**
 * Display error toast based on API error
 */
export const showErrorToast = (error: ApiError | unknown, prefix = '') => {
  const message = typeof error === 'object' && error && 'message' in error 
    ? (error as ApiError).message 
    : extractErrorMessage(error);
    
  const displayMessage = prefix ? `${prefix}: ${message}` : message;
  toast.error(displayMessage || 'An error occurred');
};
