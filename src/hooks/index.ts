
/**
 * Re-export hooks from their modular locations
 * @file Main hooks entry point providing easy access to all hooks
 */

// Primary feature modules
export * from './profiles';
export * from './organizations';
export * from './locations';
export * from './tags';
export * from './events';
export * from './tests';

/**
 * @deprecated Legacy hook exports maintained for backward compatibility.
 * Please update imports to use the modular structure directly:
 * - import { useLocations } from '@/hooks/locations'
 * - import { useProfiles } from '@/hooks/profiles'
 * - import { useTags } from '@/hooks/tags'
 */
export { useLocations } from './useLocations';
export { useProfiles } from './useProfiles';
export { useTags } from './tags';
