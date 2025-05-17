
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update imports to use modules from '@/hooks/core/factory' directly.
 */

// Re-export all query hook factory functionality from the modular location
export * from "./factory/queryHookFactory";
export * from "./factory/types";

// Add deprecation console warning in development only
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Deprecated import: Please update imports to use modules from @/hooks/core/factory directly ' +
    'instead of @/hooks/core/queryHookFactory which will be removed in a future release.'
  );
}
