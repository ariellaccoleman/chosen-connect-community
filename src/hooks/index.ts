
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

// Entity-related hooks
export * from "./useEntitySystem";
// We're already exporting useEntityRegistry from useEntitySystem, so we don't need to re-export it here
// export * from "./useEntityRegistry";
export * from "./useEntityFeed";

/**
 * Note: All legacy exports have been removed.
 * Import hooks directly from their respective module folders:
 * 
 * - import { useSelectionTags } from '@/hooks/tags';
 * - import { useLocations } from '@/hooks/locations'; 
 * - import { useCurrentProfile } from '@/hooks/profiles';
 */
