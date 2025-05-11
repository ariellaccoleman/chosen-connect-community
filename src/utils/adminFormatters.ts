
/**
 * This file exists to maintain backward compatibility with imports
 * It re-exports functions from the consolidated formatters utility
 */

import { 
  formatLocationWithDetails,
  formatAdminWithDetails,
  formatProfile
} from './formatters';

export {
  formatLocationWithDetails,
  formatAdminWithDetails,
  formatProfile
};
