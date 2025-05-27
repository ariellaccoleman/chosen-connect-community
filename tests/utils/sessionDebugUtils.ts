
import { TestClientFactory } from '@/integrations/supabase/testClient';

/**
 * Utility for debugging authentication session issues in tests
 */
export class SessionDebugUtils {
  /**
   * Comprehensive session state diagnosis
   */
  static async diagnoseSessionState(): Promise<{
    hasClient: boolean;
    hasSession: boolean;
    sessionDetails: any;
    clientInfo: any;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    
    try {
      // Check if client exists
      const client = TestClientFactory.getSharedTestClient();
      const hasClient = !!client;
      
      if (!hasClient) {
        recommendations.push('Client not found - ensure TestClientFactory.getSharedTestClient() is working');
        return {
          hasClient: false,
          hasSession: false,
          sessionDetails: null,
          clientInfo: null,
          recommendations
        };
      }
      
      // Get session details
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      
      const sessionDetails = {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        hasAccessToken: !!session?.access_token,
        tokenPreview: session?.access_token ? `[${session.access_token.substring(0, 20)}...]` : null,
        sessionError: sessionError?.message || null,
        userMetadata: session?.user?.user_metadata || null,
        appMetadata: session?.user?.app_metadata || null
      };
      
      // Get client debug info
      const clientInfo = TestClientFactory.getDebugInfo();
      
      // Generate recommendations
      if (!session) {
        recommendations.push('No session found - call TestAuthUtils.setupTestAuth() before API operations');
      } else if (!session.user) {
        recommendations.push('Session exists but no user - possible authentication error');
      } else if (!session.access_token) {
        recommendations.push('Session and user exist but no access token - authentication may be incomplete');
      } else {
        recommendations.push('Session appears healthy - check RLS policies if API operations fail');
      }
      
      if (sessionError) {
        recommendations.push(`Session error detected: ${sessionError.message}`);
      }
      
      if (clientInfo.currentAuthenticatedUser !== session?.user?.email) {
        recommendations.push('Mismatch between tracked user and session user - possible state inconsistency');
      }
      
      return {
        hasClient,
        hasSession: !!session,
        sessionDetails,
        clientInfo,
        recommendations
      };
    } catch (error) {
      recommendations.push(`Session diagnosis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        hasClient: false,
        hasSession: false,
        sessionDetails: null,
        clientInfo: null,
        recommendations
      };
    }
  }
  
  /**
   * Print detailed session diagnosis to console
   */
  static async printSessionDiagnosis(): Promise<void> {
    console.log('\n🔍 SESSION DIAGNOSIS REPORT');
    console.log('============================');
    
    const diagnosis = await this.diagnoseSessionState();
    
    console.log('📊 Client Status:', diagnosis.hasClient ? '✅ PRESENT' : '❌ MISSING');
    console.log('📊 Session Status:', diagnosis.hasSession ? '✅ PRESENT' : '❌ MISSING');
    
    if (diagnosis.sessionDetails) {
      console.log('\n📋 Session Details:');
      Object.entries(diagnosis.sessionDetails).forEach(([key, value]) => {
        console.log(`  ${key}: ${value === null ? 'null' : value}`);
      });
    }
    
    if (diagnosis.clientInfo) {
      console.log('\n🔧 Client Info:');
      Object.entries(diagnosis.clientInfo).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }
    
    if (diagnosis.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      diagnosis.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
    
    console.log('============================\n');
  }
  
  /**
   * Wait for session to be ready with detailed logging
   */
  static async waitForSessionReady(maxAttempts = 10, delayMs = 100): Promise<boolean> {
    console.log(`⏳ Waiting for session to be ready (max ${maxAttempts} attempts, ${delayMs}ms delay)...`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const diagnosis = await this.diagnoseSessionState();
      
      console.log(`🔍 Attempt ${attempt}/${maxAttempts}:`, {
        hasSession: diagnosis.hasSession,
        hasUser: diagnosis.sessionDetails?.hasUser,
        hasToken: diagnosis.sessionDetails?.hasAccessToken
      });
      
      if (diagnosis.hasSession && 
          diagnosis.sessionDetails?.hasUser && 
          diagnosis.sessionDetails?.hasAccessToken) {
        console.log(`✅ Session ready on attempt ${attempt}/${maxAttempts}`);
        return true;
      }
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    console.log(`❌ Session not ready after ${maxAttempts} attempts`);
    await this.printSessionDiagnosis();
    return false;
  }
}
