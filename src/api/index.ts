
// Export all API modules
export * from "./authApi";
export * from "./profilesApi";
export * from "./organizationsApi";
export * from "./locationsApi";
export * from "./tagsApi";
export * from "./tags"; // Add the new tags module

// Also export core utilities for direct usage when needed
export * from "./core/apiClient";
export * from "./core/errorHandler";
export * from "./core/types";
