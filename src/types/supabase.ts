
import { RealtimePostgresChangesPayload as SupabaseRealtimePayload } from '@supabase/supabase-js';

// Re-export useful Supabase types
export type RealtimePostgresChangesPayload<T = any> = SupabaseRealtimePayload<T>;

export type RealtimeFilter = {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema: string;
  table: string;
  filter?: string;
};

export type RealtimeCallback<T = any> = (payload: RealtimePostgresChangesPayload<T>) => void;
