
/**
 * Get the current schema from environment or fallback to default
 * 
 * In test environment, this will return 'testing'
 * In production/development, this will return 'public'
 */
export function getCurrentSchema(): string {
  // This allows overriding via process.env in Node or import.meta.env in browser
  const envSchema = 
    typeof process !== 'undefined' ? 
    process.env.SUPABASE_SCHEMA : 
    import.meta.env?.VITE_SUPABASE_SCHEMA;
  
  // Default to testing schema when in test mode
  if (
    process.env.NODE_ENV === 'test' || 
    import.meta.env?.MODE === 'test'
  ) {
    return 'testing';
  }
  
  // Use environment override or fallback to public
  return envSchema || 'public';
}
