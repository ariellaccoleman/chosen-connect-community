
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper } from './persistentTestUsers';

/**
 * Test utility to configure API client with authenticated user
 */
export class AuthenticatedApiTestUtils {
  private static authenticatedClient: any = null;
  
  /**
   * Set up authenticated client for API calls in tests
   */
  static async setupAuthenticatedClient(): Promise<void> {
    try {
      const userClient = await PersistentTestUserHelper.getUser1Client();
      this.authenticatedClient = userClient;
      
      // Override the TestClientFactory's getAnonClient to return our authenticated client
      const originalGetAnonClient = TestClientFactory.getAnonClient;
      TestClientFactory.getAnonClient = () => this.authenticatedClient || originalGetAnonClient();
      
    } catch (error) {
      console.warn('Could not set up authenticated client for API tests:', error);
    }
  }
  
  /**
   * Reset to original client configuration
   */
  static resetClient(): void {
    this.authenticatedClient = null;
    // Note: In a real implementation, we'd need to restore the original method
    // For now, we'll rely on test cleanup
  }
  
  /**
   * Get the current test user
   */
  static async getTestUser(): Promise<any> {
    if (!this.authenticatedClient) {
      await this.setupAuthenticatedClient();
    }
    
    if (this.authenticatedClient) {
      const { data: { user } } = await this.authenticatedClient.auth.getUser();
      return user;
    }
    
    // Fallback
    return { id: 'test-user-id' };
  }
}
