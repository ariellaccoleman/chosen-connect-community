
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

// Type for RPC functions defined in the database
type RpcFunctions = Database['public']['Functions'];

/**
 * Helper function to provide type-safe RPC calls
 * 
 * @param client The Supabase client
 * @param functionName The name of the RPC function to call
 * @param params The parameters to pass to the function
 * @returns A properly typed response
 */
export function typedRpc<
  FunctionName extends keyof RpcFunctions,
  FunctionArgs extends RpcFunctions[FunctionName]['Args'],
  FunctionReturns extends RpcFunctions[FunctionName]['Returns']
>(
  client: any,
  functionName: FunctionName,
  params: FunctionArgs
): Promise<PostgrestSingleResponse<FunctionReturns>> {
  return client.rpc(functionName as string, params);
}
