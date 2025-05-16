
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update imports to use modules from '@/hooks/core/factory' directly.
 */

export * from "./factory";

// Add deprecation console warning in development only
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Deprecated import: Please update imports to use modules from @/hooks/core/factory directly ' +
    'instead of @/hooks/core/queryHookFactory which will be removed in a future release.'
  );
}
