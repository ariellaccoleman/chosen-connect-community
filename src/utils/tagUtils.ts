
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { ... } from '@/utils/tags';
 */

export * from './tags';

// Add deprecation console warning in development only
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Deprecated import: Please update your imports to use modules from @/utils/tags directly ' +
    'instead of @/utils/tagUtils which will be removed in a future release.'
  );
}
