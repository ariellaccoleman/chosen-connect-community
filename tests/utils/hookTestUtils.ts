
import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

/**
 * Creates a test wrapper with a preconfigured QueryClient
 */
export function createTestQueryClientWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: process.env.NODE_ENV === 'test' ? () => {} : console.error,
    },
  });
  
  // Return wrapper function
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Helper to test a hook that uses react-query
 */
export async function renderQueryHook<TResult, TProps>(
  hook: (props: TProps) => TResult,
  props: TProps
) {
  const wrapper = createTestQueryClientWrapper();
  const { result } = renderHook(() => hook(props), { wrapper });
  
  // Wait for the hook to finish loading
  await waitFor(() => {
    if ('isLoading' in result.current) {
      expect((result.current as any).isLoading).toBe(false);
    }
  });
  
  return { result };
}
