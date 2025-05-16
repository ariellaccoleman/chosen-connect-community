
// Re-export hooks from their new locations
export * from './profiles';
export * from './locations';
export * from './tags';
export * from './tests';

// Re-export individual hooks for backward compatibility
export { useLocations } from './useLocations';
export { useProfiles } from './useProfiles';
export { useTags } from './tags';
