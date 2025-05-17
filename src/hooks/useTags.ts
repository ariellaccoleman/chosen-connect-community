
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { useSelectionTags, useFilterTags, useEntityTags } from '@/hooks/tags';
 */

// Re-export from the consolidated tags module
export * from './tags';

// Add deprecation console warning in development only
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Deprecated import: Please update your imports to use modules from @/hooks/tags directly ' +
    'instead of @/hooks/useTags which will be removed in a future release.'
  );
}
