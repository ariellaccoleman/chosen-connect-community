import { authApi } from '@/api/authApi';
import { mockSupabase, resetSupabaseMocks, mockAuthResponse, mockErrorResponse } from '../__mocks__/supabase';
import { createSuccessResponse, createErrorResponse } from '@/api/core/errorHandler';

// Mock the apiClient module
jest.mock('@/api/core/apiClient', () => ({
  apiClient: {
    authQuery: jest.fn(async (callback) => {
      try {
        return await callback(mockSupabase.auth);
      } catch (error) {
        return createErrorResponse(error);
      }
    })
  }
}));

/**
 * @deprecated This test suite uses mocks and will be replaced by authApi.integration.test.ts
 * 
 * MIGRATION STATUS: These tests are being replaced by database integration tests.
 * See: tests/api/authApi.integration.test.ts
 * 
 * This file will be removed once the integration tests are validated.
 */
describe.skip('Auth API (Mock Tests - DEPRECATED)', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('signUp', () => {
    test('successfully registers a new user', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce(mockAuthResponse);
      
      const signUpData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      const result = await authApi.signUp(signUpData);
      
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            first_name: 'John',
            last_name: 'Doe'
          }
        }
      });
      
      expect(result.status).toBe('success');
      expect(result.data?.user).toEqual(mockAuthResponse.data.user);
    });

    test('handles signup error', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce(mockErrorResponse);
      
      const signUpData = {
        email: 'existing@example.com',
        password: 'password123'
      };
      
      const result = await authApi.signUp(signUpData);
      
      expect(mockSupabase.auth.signUp).toHaveBeenCalled();
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('login', () => {
    test('successfully logs in a user', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce(mockAuthResponse);
      
      const loginData = {
        email: 'user@example.com',
        password: 'password123'
      };
      
      const result = await authApi.login(loginData);
      
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123'
      });
      
      expect(result.status).toBe('success');
      expect(result.data?.user).toEqual(mockAuthResponse.data.user);
    });

    test('handles login error', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce(mockErrorResponse);
      
      const loginData = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      };
      
      const result = await authApi.login(loginData);
      
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('logout', () => {
    test('successfully logs out a user', async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });
      
      const result = await authApi.logout();
      
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });
  });

  describe('getSession', () => {
    test('successfully gets user session', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: mockAuthResponse.data.user } },
        error: null
      });
      
      const result = await authApi.getSession();
      
      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      expect(result.status).toBe('success');
      expect(result.data?.user).toBeDefined();
    });
  });

  describe('resetPasswordRequest', () => {
    test('successfully requests password reset', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });
      
      const result = await authApi.resetPasswordRequest({ email: 'user@example.com' });
      
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.objectContaining({ redirectTo: expect.any(String) })
      );
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });
  });

  describe('updatePassword', () => {
    test('successfully updates password', async () => {
      mockSupabase.auth.updateUser.mockResolvedValueOnce({ error: null, data: {} });
      
      const result = await authApi.updatePassword({ password: 'newpassword123' });
      
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123'
      });
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });
  });
});
