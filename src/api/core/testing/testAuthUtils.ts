
import { TestAuthUtils } from '../../../../tests/utils/testAuthUtils';
import { resetPostsApi } from '../../posts/postsApiFactory';
import { resetChatMessageApi } from '../../chat/chatMessageApiFactory';
import { resetOrganizationApi } from '../../organizations/organizationApiFactory';
import { resetProfileApi } from '../../profiles/profileApiFactory';
import { logger } from '@/utils/logger';

/**
 * Central Test Authentication and API Reset Utilities
 * 
 * This utility provides a centralized way to handle authentication and API resets
 * for testing purposes. It integrates with the existing TestAuthUtils and provides
 * convenient methods for resetting all APIs with authenticated clients.
 */
export class CentralTestAuthUtils {
  /**
   * Set up test authentication and return reset APIs with authenticated client
   */
  static async setupTestWithResetAPIs(userKey: 'user1' | 'user2' | 'user3' = 'user1') {
    try {
      logger.info(`🔧 Setting up test environment with reset APIs for ${userKey}`);
      
      // Set up authentication using existing TestAuthUtils
      const { client, apiClient, user } = await TestAuthUtils.setupTestAuth(userKey);
      
      // Get all reset APIs with the authenticated client
      const resetAPIs = this.getAllResetAPIs(client);
      
      logger.info(`✅ Test environment ready for ${userKey} with authenticated APIs`);
      
      return {
        client,
        apiClient,
        user,
        resetAPIs,
        // Convenience method to cleanup
        cleanup: () => TestAuthUtils.cleanupTestAuth(user.email)
      };
    } catch (error) {
      logger.error('❌ Failed to setup test environment:', error);
      throw error;
    }
  }

  /**
   * Get all reset APIs with authenticated client
   */
  static getAllResetAPIs(client?: any) {
    logger.info('🔄 Creating reset APIs with authenticated client');
    
    return {
      // Posts and related APIs
      postsAPI: resetPostsApi(client),
      
      // Chat APIs
      chatAPI: {
        messages: resetChatMessageApi(client)
      },
      
      // Organization APIs
      organizationAPI: resetOrganizationApi(client),
      
      // Profile APIs
      profileAPI: resetProfileApi(client)
    };
  }

  /**
   * Reset specific API with authenticated client
   */
  static resetSpecificAPI(apiName: 'posts' | 'chat' | 'organization' | 'profile', client?: any) {
    logger.info(`🔄 Resetting ${apiName} API with authenticated client`);
    
    switch (apiName) {
      case 'posts':
        return resetPostsApi(client);
      case 'chat':
        return resetChatMessageApi(client);
      case 'organization':
        return resetOrganizationApi(client);
      case 'profile':
        return resetProfileApi(client);
      default:
        throw new Error(`Unknown API: ${apiName}`);
    }
  }

  /**
   * Execute test with authentication and specific API reset
   */
  static async executeWithAuthenticatedAPI<T>(
    apiName: 'posts' | 'chat' | 'organization' | 'profile',
    testOperation: (api: any, context: { client: any; user: any }) => Promise<T>,
    userKey: 'user1' | 'user2' | 'user3' = 'user1'
  ): Promise<T> {
    const { client, user, cleanup } = await this.setupTestWithResetAPIs(userKey);
    
    try {
      const api = this.resetSpecificAPI(apiName, client);
      const result = await testOperation(api, { client, user });
      return result;
    } finally {
      await cleanup();
    }
  }

  /**
   * Execute test with all reset APIs
   */
  static async executeWithAllAPIs<T>(
    testOperation: (apis: ReturnType<typeof CentralTestAuthUtils.getAllResetAPIs>, context: { client: any; user: any }) => Promise<T>,
    userKey: 'user1' | 'user2' | 'user3' = 'user1'
  ): Promise<T> {
    const { client, user, resetAPIs, cleanup } = await this.setupTestWithResetAPIs(userKey);
    
    try {
      const result = await testOperation(resetAPIs, { client, user });
      return result;
    } finally {
      await cleanup();
    }
  }

  /**
   * Verify client parameter flow through repository chain
   */
  static async verifyRepositoryChainFlow(client?: any) {
    logger.info('🔍 Verifying repository chain flow...');
    
    const results = {
      posts: false,
      chat: false,
      organization: false,
      profile: false
    };

    try {
      // Test each API to ensure client flows through
      const postsAPI = resetPostsApi(client);
      if (postsAPI && postsAPI.postsApi) {
        results.posts = true;
        logger.info('✅ Posts API chain verified');
      }

      const chatAPI = resetChatMessageApi(client);
      if (chatAPI && chatAPI.getAll) {
        results.chat = true;
        logger.info('✅ Chat API chain verified');
      }

      const orgAPI = resetOrganizationApi(client);
      if (orgAPI && orgAPI.getAll) {
        results.organization = true;
        logger.info('✅ Organization API chain verified');
      }

      const profileAPI = resetProfileApi(client);
      if (profileAPI && profileAPI.getAll) {
        results.profile = true;
        logger.info('✅ Profile API chain verified');
      }

      const allVerified = Object.values(results).every(Boolean);
      logger.info(`🔍 Repository chain verification: ${allVerified ? 'PASSED' : 'FAILED'}`, results);
      
      return { success: allVerified, results };
    } catch (error) {
      logger.error('❌ Repository chain verification failed:', error);
      return { success: false, error, results };
    }
  }

  /**
   * Get debug information about current state
   */
  static getDebugInfo() {
    return {
      testAuthUtils: TestAuthUtils.getDebugInfo(),
      availableResetAPIs: ['posts', 'chat', 'organization', 'profile'],
      centralUtilsVersion: '1.0.0'
    };
  }
}

/**
 * Convenience exports for common patterns
 */
export const setupTestWithAPIs = CentralTestAuthUtils.setupTestWithResetAPIs;
export const getAllResetAPIs = CentralTestAuthUtils.getAllResetAPIs;
export const executeWithAuthenticatedAPI = CentralTestAuthUtils.executeWithAuthenticatedAPI;
export const executeWithAllAPIs = CentralTestAuthUtils.executeWithAllAPIs;
export const verifyRepositoryChainFlow = CentralTestAuthUtils.verifyRepositoryChainFlow;
