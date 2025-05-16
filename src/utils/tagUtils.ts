
/**
 * Re-export all tag functionality from the tags directory
 * @deprecated Use imports from '@/utils/tags' directly
 */

export * from './tags/index';

// Add deprecation console warning in development only
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Deprecated import: Please update your imports to use modules from @/utils/tags directly ' +
    'instead of @/utils/tagUtils which will be removed in a future release.'
  );
}
