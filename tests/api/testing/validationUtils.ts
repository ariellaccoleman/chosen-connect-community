
/**
 * Validation utilities for testing
 * Moved from src/api/core/testing/validationUtils.ts
 */

/**
 * Validate that an object has all required properties
 */
export const validateRequiredProperties = (obj: any, requiredProps: string[]): boolean => {
  return requiredProps.every(prop => obj.hasOwnProperty(prop) && obj[prop] !== undefined && obj[prop] !== null);
};

/**
 * Validate that an object matches expected structure
 */
export const validateObjectStructure = (obj: any, expectedStructure: Record<string, string>): boolean => {
  return Object.entries(expectedStructure).every(([key, expectedType]) => {
    if (!obj.hasOwnProperty(key)) return false;
    
    const actualType = typeof obj[key];
    return actualType === expectedType;
  });
};

/**
 * Validate API response structure
 */
export const validateApiResponse = (response: any): boolean => {
  return (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    'error' in response &&
    'status' in response
  );
};

/**
 * Validate that a string is a valid UUID
 */
export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate timestamp format
 */
export const validateTimestamp = (timestamp: string): boolean => {
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
