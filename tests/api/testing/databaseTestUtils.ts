
/**
 * Database testing utilities
 * Moved and consolidated from src/api/core/testing/
 */

import { TestClientFactory } from '@/integrations/supabase/testClient';
import { logger } from '@/utils/logger';

/**
 * Database connection validation for tests
 */
export const validateDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await TestClientFactory.getSharedTestClient();
    const { data, error } = await client.from('profiles').select('count').limit(1);
    
    if (error) {
      logger.error('Database connection validation failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Database connection test error:', error);
    return false;
  }
};

/**
 * Clean up test data for a specific user
 */
export const cleanupUserTestData = async (userEmail: string): Promise<void> => {
  try {
    const client = await TestClientFactory.getUserClient(userEmail, 'password');
    
    // Clean up user's test data
    await client.from('tag_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    logger.info(`Cleaned up test data for user: ${userEmail}`);
  } catch (error) {
    logger.warn(`Failed to cleanup test data for ${userEmail}:`, error);
  }
};

/**
 * Verify table exists and is accessible
 */
export const verifyTableAccess = async (tableName: string, client?: any): Promise<boolean> => {
  try {
    const testClient = client || await TestClientFactory.getSharedTestClient();
    const { error } = await testClient.from(tableName).select('*').limit(1);
    
    return !error;
  } catch (error) {
    logger.error(`Table access verification failed for ${tableName}:`, error);
    return false;
  }
};
