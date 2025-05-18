
/**
 * Chat hook exports 
 */
// Export the latest factory-based hooks as primary
export * from './useChatChannels';
export * from './useChatRealtime';
export * from './useChat';
export * from './useChatMessageFactory';

// No longer export the deprecated hooks from useChatMessages - they're still available
// directly from their file if needed, but we don't export them at the module level
// export * from './useChatMessages';
