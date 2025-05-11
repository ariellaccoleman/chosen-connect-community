
/**
 * Centralized logging utility that controls log output based on environment
 * Only shows logs in development or when debug flags are enabled
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Check if we're in development environment
const isDev = process.env.NODE_ENV !== 'production';

// Global debug setting that can be toggled during runtime
let isDebugEnabled = isDev;

/**
 * Centralized logger that respects environment and debug settings
 */
export const logger = {
  // Enable or disable debug logging at runtime
  setDebugEnabled: (enabled: boolean) => {
    isDebugEnabled = enabled;
  },
  
  // Check if debugging is currently enabled
  isDebugEnabled: () => isDebugEnabled,

  debug: (message: string, ...args: any[]) => {
    if (isDev || isDebugEnabled) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDev || isDebugEnabled) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  
  error: (message: string, error?: any, ...args: any[]) => {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, error.message, ...args);
      if (isDev || isDebugEnabled) {
        console.error(error.stack);
      }
    } else {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  }
};
