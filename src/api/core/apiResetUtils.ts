
/**
 * Central API Reset Utility
 * 
 * This utility provides a centralized way to reset all API instances with an authenticated client.
 * This is primarily used in testing to ensure all APIs use the authenticated test client.
 */

import { resetProfileApi } from '../profiles/profileApiFactory';
import { resetOrganizationApi } from '../organizations/organizationApiFactory';
import { resetEventApi } from '../events/eventApiFactory';
import { resetChatChannelsApi } from '../chat/chatChannelsApi';
import { resetTagApis } from '../tags/factory/tagApiFactory';
import { logger } from '@/utils/logger';

/**
 * Reset all API instances with the provided authenticated client
 * 
 * @param authenticatedClient - The authenticated Supabase client to use for all APIs
 * @returns Object containing all reset API instances
 */
export function resetAllApis(authenticatedClient: any) {
  logger.info('Resetting all API instances with authenticated client');
  
  try {
    // Reset all API factories with the authenticated client
    const profileApi = resetProfileApi(authenticatedClient);
    const organizationApi = resetOrganizationApi(authenticatedClient);
    const { eventApi, extendedEventApi } = resetEventApi(authenticatedClient);
    const chatChannelsApi = resetChatChannelsApi(authenticatedClient);
    const { tagApi, tagAssignmentApi, tagAssignmentRelationshipApi } = resetTagApis(authenticatedClient);
    
    logger.info('Successfully reset all API instances');
    
    return {
      profileApi,
      organizationApi,
      eventApi,
      extendedEventApi,
      chatChannelsApi,
      tagApi,
      tagAssignmentApi,
      tagAssignmentRelationshipApi
    };
  } catch (error) {
    logger.error('Error resetting API instances:', error);
    throw error;
  }
}

/**
 * Check if all APIs are using the authenticated client
 * This is a utility function for testing to verify the reset worked correctly
 */
export function verifyApiClientReset(): boolean {
  // This is a placeholder for verification logic
  // In a real implementation, you might check internal client references
  logger.info('Verifying API client reset (placeholder implementation)');
  return true;
}
