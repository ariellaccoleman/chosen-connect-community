
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nvaqqkffmfuxdnwnqhxo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YXFxa2ZmbWZ1eGRud25xaHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNDgxODYsImV4cCI6MjA2MTgyNDE4Nn0.rUwLwOr8QSzhJi3J2Mi_D94Zy-zLWykw7_mXY29UmP4";

/**
 * Test Client Factory
 * Creates different Supabase clients for different testing scenarios
 */
export class TestClientFactory {
  private static serviceRoleClient: SupabaseClient<Database> | null = null;
  private static anonClient: SupabaseClient<Database> | null = null;

  /**
   * Get service role client for schema setup and administrative operations
   * Only use for initial test infrastructure setup, not for testing application logic
   */
  static getServiceRoleClient(): SupabaseClient<Database> {
    if (!this.serviceRoleClient) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY not found - required for test infrastructure setup');
      }

      console.log('🔧 Creating service role client for test infrastructure');
      
      this.serviceRoleClient = createClient<Database>(SUPABASE_URL, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });
    }
    
    return this.serviceRoleClient;
  }

  /**
   * Get anonymous client for testing application logic
   * This mimics production behavior and should be used for most tests
   */
  static getAnonClient(): SupabaseClient<Database> {
    if (!this.anonClient) {
      console.log('🔧 Creating anonymous client for application testing');
      
      this.anonClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });
    }
    
    return this.anonClient;
  }

  /**
   * Create an authenticated client for a specific test user
   */
  static async createAuthenticatedClient(userEmail: string, userPassword: string): Promise<SupabaseClient<Database>> {
    const client = this.getAnonClient();
    
    const { data, error } = await client.auth.signInWithPassword({
      email: userEmail,
      password: userPassword
    });

    if (error) {
      throw new Error(`Failed to authenticate test user: ${error.message}`);
    }

    console.log(`🔧 Created authenticated client for user: ${userEmail}`);
    return client;
  }

  /**
   * Clean up clients (call in test teardown)
   */
  static cleanup(): void {
    this.serviceRoleClient = null;
    this.anonClient = null;
  }
}

/**
 * Test Infrastructure Utils
 * Secure utilities for managing test schemas and data
 */
export class TestInfrastructure {
  private static serviceClient = TestClientFactory.getServiceRoleClient();

  /**
   * Create a test schema using the secure function
   */
  static async createTestSchema(baseName = 'test'): Promise<string> {
    const schemaName = `${baseName}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const { data, error } = await this.serviceClient.rpc('create_test_schema', {
      schema_name: schemaName
    });

    if (error) {
      throw new Error(`Failed to create test schema: ${error.message}`);
    }

    console.log(`✅ Created test schema: ${schemaName}`);
    return schemaName;
  }

  /**
   * Drop a test schema using the secure function
   */
  static async dropTestSchema(schemaName: string): Promise<void> {
    const { data, error } = await this.serviceClient.rpc('drop_test_schema', {
      schema_name: schemaName
    });

    if (error) {
      throw new Error(`Failed to drop test schema: ${error.message}`);
    }

    console.log(`✅ Dropped test schema: ${schemaName}`);
  }

  /**
   * Validate schema structure using the secure function
   */
  static async validateSchema(schemaName: string): Promise<any> {
    const { data, error } = await this.serviceClient.rpc('validate_schema_structure', {
      target_schema: schemaName
    });

    if (error) {
      throw new Error(`Failed to validate schema: ${error.message}`);
    }

    return data;
  }

  /**
   * Get table information using the secure function
   */
  static async getTableInfo(schemaName: string, tableName: string): Promise<any> {
    const { data, error } = await this.serviceClient.rpc('get_table_info', {
      p_schema: schemaName,
      p_table: tableName
    });

    if (error) {
      throw new Error(`Failed to get table info: ${error.message}`);
    }

    return data;
  }

  /**
   * Create test users for authentication testing
   */
  static async createTestUser(email: string, password: string, metadata?: any): Promise<any> {
    const { data, error } = await this.serviceClient.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata || {},
      email_confirm: true
    });

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    console.log(`✅ Created test user: ${email}`);
    return data.user;
  }

  /**
   * Delete test users
   */
  static async deleteTestUser(userId: string): Promise<void> {
    const { error } = await this.serviceClient.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Failed to delete test user: ${error.message}`);
    }

    console.log(`✅ Deleted test user: ${userId}`);
  }
}
