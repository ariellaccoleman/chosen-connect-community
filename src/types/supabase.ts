import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeFilter {
  event: RealtimeEvent;
  schema: string;
  table: string;
  filter?: string;
}

export type RealtimeCallback<T = any> = (payload: RealtimePostgresChangesPayload<T>) => void;

declare module '@supabase/supabase-js' {
  interface RealtimeChannel {
    on(
      event: 'postgres_changes',
      filter: RealtimeFilter,
      callback: RealtimeCallback
    ): RealtimeChannel;
  }
} 