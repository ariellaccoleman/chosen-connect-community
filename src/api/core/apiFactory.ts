
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update imports to use modules from '@/api/core/factory/apiFactory' directly.
 */

export * from "./factory/apiFactory";

// Add deprecation console warning in development only
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Deprecated import: Please update imports to use modules from @/api/core/factory/apiFactory directly ' +
    'instead of @/api/core/apiFactory which will be removed in a future release.'
  );
}
