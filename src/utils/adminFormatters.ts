
/**
 * This file exists to maintain backward compatibility with imports
 * It re-exports functions from the consolidated formatters utility
 */

import { 
  formatLocationWithDetails,
  formatAdminWithDetails,
  formatProfileWithDetails  // This is the correct function name based on the formatters.ts file
} from './formatters';

export {
  formatLocationWithDetails,
  formatAdminWithDetails,
  formatProfileWithDetails as formatProfile  // Re-export with the old name for backward compatibility
};
