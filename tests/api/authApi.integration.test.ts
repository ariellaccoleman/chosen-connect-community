
import { authApi } from '@/api/authApi';
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper } from '../utils/persistentTestUsers';
import { TestAuthUtils } from '../utils/testAuthUtils';

/**
 * Integration tests for Authentication API
 * 
 * These tests run against a real Supabase auth system to ensure the API works correctly
 * with actual authentication flows, sessions, and error conditions.
 * 
 * Uses user3 to avoid interference with other test suites.
 */
describe('Authentication API - Integration Tests', () => {
  let testUserEmail: string;
  let testUserPassword: string;
  
  beforeAll(async () => {
    // Verify test users are set up
    const isSetup = await PersistentTestUserHelper.verifyTestUsersSetup();
    if (!isSetup) {
      console.warn('⚠️ Persistent test users not set up - some tests may fail');
    }

    // Verify service role key is available
    try {
      TestClientFactory.getServiceRoleClient();
      console.log('✅ Service role client available for tests');
    } catch (error) {
      console.error('❌ Service role client not available:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    // Clean up any existing authentication state first
    await TestAuthUtils.cleanupTestAuth();
    
    // Set up test user credentials (using user3 for auth tests)
    testUserEmail = 'testuser6@example.com'; // user3 maps to testuser6
    testUserPassword = 'password123'; // From TEST_USER_CONFIG
    
    console.log(`🔐 Prepared auth test credentials: ${testUserEmail}`);
  });

  afterEach(async () => {
    await TestAuthUtils.cleanupTestAuth();
  });

  afterAll(() => {
    TestClientFactory.cleanup();
  });

  describe('login', () => {
    test('successfully logs in with valid credentials', async () => {
      console.log('🧪 Testing successful login...');
      
      const loginData = {
        email: testUserEmail,
        password: testUserPassword
      };
      
      const result = await authApi.login(loginData);
      
      console.log('🔍 LOGIN RESULT:', {
        status: result.status,
        hasUser: !!result.data?.user,
        userEmail: result.data?.user?.email,
        error: result.error
      });
      
      expect(result.status).toBe('success');
      expect(result.data?.user).toBeTruthy();
      expect(result.data?.user?.email).toBe(testUserEmail);
    });

    test('handles login with invalid credentials', async () => {
      console.log('🧪 Testing login with invalid credentials...');
      
      const loginData = {
        email: testUserEmail,
        password: 'wrongpassword'
      };
      
      const result = await authApi.login(loginData);
      
      console.log('🔍 INVALID LOGIN RESULT:', {
        status: result.status,
        error: result.error
      });
      
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });

    test('handles login with non-existent email', async () => {
      console.log('🧪 Testing login with non-existent email...');
      
      const loginData = {
        email: 'nonexistent@example.com',
        password: testUserPassword
      };
      
      const result = await authApi.login(loginData);
      
      console.log('🔍 NON-EXISTENT EMAIL RESULT:', {
        status: result.status,
        error: result.error
      });
      
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('getSession', () => {
    test('returns null session when not authenticated', async () => {
      console.log('🧪 Testing getSession when not authenticated...');
      
      const result = await authApi.getSession();
      
      console.log('🔍 NO SESSION RESULT:', {
        status: result.status,
        hasUser: !!result.data?.user,
        error: result.error
      });
      
      expect(result.status).toBe('success');
      expect(result.data?.user).toBeNull();
    });

    test('returns valid session when authenticated', async () => {
      console.log('🧪 Testing getSession when authenticated...');
      
      // First login
      const loginResult = await authApi.login({
        email: testUserEmail,
        password: testUserPassword
      });
      
      expect(loginResult.status).toBe('success');
      
      // Then check session
      const sessionResult = await authApi.getSession();
      
      console.log('🔍 AUTHENTICATED SESSION RESULT:', {
        status: sessionResult.status,
        hasUser: !!sessionResult.data?.user,
        userEmail: sessionResult.data?.user?.email,
        error: sessionResult.error
      });
      
      expect(sessionResult.status).toBe('success');
      expect(sessionResult.data?.user).toBeTruthy();
      expect(sessionResult.data?.user?.email).toBe(testUserEmail);
    });
  });

  describe('logout', () => {
    test('successfully logs out authenticated user', async () => {
      console.log('🧪 Testing successful logout...');
      
      // First login
      const loginResult = await authApi.login({
        email: testUserEmail,
        password: testUserPassword
      });
      
      expect(loginResult.status).toBe('success');
      
      // Then logout
      const logoutResult = await authApi.logout();
      
      console.log('🔍 LOGOUT RESULT:', {
        status: logoutResult.status,
        data: logoutResult.data,
        error: logoutResult.error
      });
      
      expect(logoutResult.status).toBe('success');
      expect(logoutResult.data).toBe(true);
      
      // Verify session is cleared
      const sessionResult = await authApi.getSession();
      expect(sessionResult.data?.user).toBeNull();
    });

    test('handles logout when not authenticated', async () => {
      console.log('🧪 Testing logout when not authenticated...');
      
      const logoutResult = await authApi.logout();
      
      console.log('🔍 LOGOUT WHEN NOT AUTH RESULT:', {
        status: logoutResult.status,
        data: logoutResult.data,
        error: logoutResult.error
      });
      
      // Logout should succeed even when not authenticated
      expect(logoutResult.status).toBe('success');
    });
  });

  describe('resetPasswordRequest', () => {
    test('successfully requests password reset for existing user', async () => {
      console.log('🧪 Testing password reset request...');
      
      const result = await authApi.resetPasswordRequest({ 
        email: testUserEmail 
      });
      
      console.log('🔍 PASSWORD RESET RESULT:', {
        status: result.status,
        data: result.data,
        error: result.error
      });
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });

    test('handles password reset for non-existent email gracefully', async () => {
      console.log('🧪 Testing password reset for non-existent email...');
      
      const result = await authApi.resetPasswordRequest({ 
        email: 'nonexistent@example.com' 
      });
      
      console.log('🔍 PASSWORD RESET NON-EXISTENT RESULT:', {
        status: result.status,
        data: result.data,
        error: result.error
      });
      
      // Supabase typically returns success even for non-existent emails for security
      expect(result.status).toBe('success');
    });
  });

  describe('updatePassword', () => {
    test('successfully updates password for authenticated user', async () => {
      console.log('🧪 Testing password update...');
      
      // First login
      const loginResult = await authApi.login({
        email: testUserEmail,
        password: testUserPassword
      });
      
      expect(loginResult.status).toBe('success');
      
      // Update password
      const updateResult = await authApi.updatePassword({ 
        password: 'newpassword123' 
      });
      
      console.log('🔍 PASSWORD UPDATE RESULT:', {
        status: updateResult.status,
        data: updateResult.data,
        error: updateResult.error
      });
      
      expect(updateResult.status).toBe('success');
      expect(updateResult.data).toBe(true);
    });

    test('handles password update when not authenticated', async () => {
      console.log('🧪 Testing password update when not authenticated...');
      
      const updateResult = await authApi.updatePassword({ 
        password: 'newpassword123' 
      });
      
      console.log('🔍 PASSWORD UPDATE NOT AUTH RESULT:', {
        status: updateResult.status,
        error: updateResult.error
      });
      
      expect(updateResult.status).toBe('error');
      expect(updateResult.error).toBeDefined();
    });
  });

  describe('authentication flow integration', () => {
    test('complete login -> session check -> logout flow', async () => {
      console.log('🧪 Testing complete authentication flow...');
      
      // 1. Start with no session
      let sessionResult = await authApi.getSession();
      expect(sessionResult.data?.user).toBeNull();
      
      // 2. Login
      const loginResult = await authApi.login({
        email: testUserEmail,
        password: testUserPassword
      });
      expect(loginResult.status).toBe('success');
      
      // 3. Verify session exists
      sessionResult = await authApi.getSession();
      expect(sessionResult.data?.user).toBeTruthy();
      expect(sessionResult.data?.user?.email).toBe(testUserEmail);
      
      // 4. Logout
      const logoutResult = await authApi.logout();
      expect(logoutResult.status).toBe('success');
      
      // 5. Verify session is cleared
      sessionResult = await authApi.getSession();
      expect(sessionResult.data?.user).toBeNull();
      
      console.log('✅ Complete authentication flow successful');
    });
  });
}, 30000); // Increased timeout for integration tests
