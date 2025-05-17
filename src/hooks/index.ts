
/**
 * Re-export hooks from their modular locations
 * @file Main hooks entry point providing easy access to all hooks
 */

// Primary feature modules - use these modular imports going forward
export * from './profiles';
export * from './organizations';
export * from './locations';
export * from './tags';
export * from './events';
export * from './tests';

/**
 * @deprecated The following legacy exports are maintained for backward compatibility only.
 * They will be removed in the next major version (Q4 2025).
 * Please update your code to use the modular structure directly as shown:
 * 
 * Instead of: import { useLocations } from '@/hooks';
 * Use: import { useLocations } from '@/hooks/locations';
 * 
 * Instead of: import { useCurrentProfile } from '@/hooks';
 * Use: import { useCurrentProfile } from '@/hooks/profiles';
 * 
 * Instead of: import { useTags } from '@/hooks';
 * Use: import { useSelectionTags } from '@/hooks/tags';
 */
export { useLocations } from './useLocations';
export { useProfiles } from './useProfiles';

// Renamed re-export for backward compatibility
// Will be removed in Q4 2025
export { useSelectionTags as useTags } from './tags';
