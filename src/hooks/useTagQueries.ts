
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { useEntityTags, useFilterTags, useSelectionTags } from '@/hooks/tags';
 */

// Re-export from the consolidated module
export { 
  useEntityTags, 
  useFilterTags, 
  useSelectionTags 
} from './tags';

// Add deprecation console warning in development only
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Deprecated import: Please update your imports to use modules from @/hooks/tags directly ' +
    'instead of @/hooks/useTagQueries which will be removed in a future release.'
  );
}
