
import { ApiResponse } from "@/api/core/errorHandler";
import { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";

/**
 * Configuration for entity query hooks
 */
export interface EntityConfig {
  /** Entity name for query keys, logging, and toast messages */
  name: string;
  /** Plural form of the entity name */
  pluralName?: string;
  /** Display name for user-facing messages */
  displayName?: string;
  /** Plural display name for user-facing messages */
  pluralDisplayName?: string;
}

/**
 * Configuration for toast messages
 */
export interface ToastConfig {
  successMessage: string;
  errorMessagePrefix: string;
}

/**
 * Type for mutation options with correct generics
 */
export type MutationOptionsType<TData, TVariables> = UseMutationOptions<
  ApiResponse<TData>, 
  unknown, 
  TVariables, 
  unknown
>;

/**
 * Type for query options with correct generics
 */
export type QueryOptionsType<TData> = UseQueryOptions<ApiResponse<TData>>;
