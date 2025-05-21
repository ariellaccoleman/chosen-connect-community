
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CreateOrganization from '@/pages/CreateOrganization';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as hooks from '@/hooks/organizations';
import { BrowserRouter } from 'react-router-dom';
import * as AuthHook from '@/hooks/useAuth';

// Mock react-router-dom
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
  Navigate: jest.fn(({ to, state }) => (
    <div data-testid="mock-navigate">
      Redirected to {to} with state: {JSON.stringify(state)}
    </div>
  ))
}));

// Mock the hooks
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('@/hooks/organizations', () => ({
  useCreateOrganizationWithRelationships: jest.fn()
}));

// Create a wrapper for the component with necessary providers
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </BrowserRouter>
);

describe('CreateOrganization Component', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockMutateAsync = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('redirects unauthenticated users to auth page with correct state', () => {
    // Mock unauthenticated state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: null,
      loading: false, // Important: Set loading to false so the component doesn't show skeleton
      authenticated: false,
      isAuthenticated: false // Add this to match the actual hook return value
    }));
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Check for redirect with correct 'from' state
    expect(screen.getByTestId('mock-navigate')).toBeInTheDocument();
    expect(screen.getByText(/Redirected to \/auth with state:/)).toBeInTheDocument();
    expect(screen.getByText(/organizations\/new/)).toBeInTheDocument();
    
    // Ensure form is not rendered for unauthenticated users
    expect(screen.queryByText('Create New Organization')).not.toBeInTheDocument();
  });

  test('shows loading skeleton while checking authentication', () => {
    // Mock loading state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: null,
      loading: true, 
      authenticated: false,
      isAuthenticated: false // Add this to match the actual hook
    }));
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Verify skeleton components are shown during loading
    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThan(0);
    
    // Ensure form is not rendered during loading
    expect(screen.queryByText('Create New Organization')).not.toBeInTheDocument();
  });

  test('renders the create organization form for authenticated users', () => {
    // Mock authenticated state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: mockUser,
      loading: false,
      authenticated: true,
      isAuthenticated: true // Add this to match the actual hook
    }));
    
    // Mock organization creation hook
    jest.spyOn(hooks, 'useCreateOrganizationWithRelationships').mockImplementation(() => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      isSuccess: false
    } as any));
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Check for form elements - updated to match the actual component implementation
    expect(screen.getByText('Create New Organization')).toBeInTheDocument();
    // Use getByRole instead of getByLabelText for more reliable selection
    expect(screen.getByLabelText(/Organization Name\*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Website URL/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Organization/i })).toBeInTheDocument();
  });

  test('handles form submission correctly for authenticated users', async () => {
    // Mock authenticated state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: mockUser,
      loading: false,
      authenticated: true,
      isAuthenticated: true // Add this to match the actual hook
    }));
    
    // Mock successful mutation response
    mockMutateAsync.mockResolvedValueOnce('new-org-id');
    
    // Mock organization creation hook
    jest.spyOn(hooks, 'useCreateOrganizationWithRelationships').mockImplementation(() => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      isSuccess: false
    } as any));
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Fill out the form - updated to match the actual component implementation
    fireEvent.change(screen.getByLabelText(/Organization Name\*/i), {
      target: { value: 'Test Organization' }
    });
    
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'This is a test organization' }
    });
    
    fireEvent.change(screen.getByLabelText(/Website URL/i), {
      target: { value: 'https://test.org' }
    });
    
    // Submit the form - find button with exact role and name
    const submitButton = screen.getByRole('button', { name: /Create Organization/i });
    expect(submitButton).toBeInTheDocument();
    fireEvent.click(submitButton);
    
    // Verify mutation was called with correct data
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: 'Test Organization',
        description: 'This is a test organization',
        website_url: 'https://test.org',
        userId: 'user-123'
      });
    });
    
    // Verify navigation happened
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/organizations/new-org-id');
    });
  });

  test('validates form inputs', async () => {
    // Mock authenticated state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: mockUser,
      loading: false,
      authenticated: true,
      isAuthenticated: true // Add this to match the actual hook
    }));
    
    // Mock organization creation hook
    jest.spyOn(hooks, 'useCreateOrganizationWithRelationships').mockImplementation(() => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      isSuccess: false
    } as any));
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Submit form without required fields
    const submitButton = screen.getByRole('button', { name: /Create Organization/i });
    fireEvent.click(submitButton);
    
    // Check for validation messages - updated to match actual validation messages
    await waitFor(() => {
      expect(screen.getByText(/Organization name must be at least 2 characters/i)).toBeInTheDocument();
    });
    
    // Enter invalid URL
    fireEvent.change(screen.getByLabelText(/Organization Name\*/i), {
      target: { value: 'Test Organization' }
    });
    
    fireEvent.change(screen.getByLabelText(/Website URL/i), {
      target: { value: 'not-a-url' }
    });
    
    // Submit form again
    fireEvent.click(submitButton);
    
    // Check for URL validation message - updated to match actual validation message
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid URL/i)).toBeInTheDocument();
    });
    
    // Verify mutation was not called
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  test('shows loading state during submission', async () => {
    // Mock authenticated state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: mockUser,
      loading: false,
      authenticated: true,
      isAuthenticated: true // Add this to match the actual hook
    }));
    
    // Mock pending mutation state
    jest.spyOn(hooks, 'useCreateOrganizationWithRelationships').mockImplementation(() => ({
      mutateAsync: mockMutateAsync,
      isPending: true, // Important: Set isPending to true
      isError: false,
      isSuccess: false
    } as any));
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Check for loading state - the button should now display "Creating..."
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
  });

  test('prevents form submission if user becomes unauthenticated during submission', async () => {
    // Start with authenticated state
    const authHookSpy = jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: mockUser,
      loading: false,
      authenticated: true,
      isAuthenticated: true // Add this to match the actual hook
    }));
    
    // Mock organization creation hook
    jest.spyOn(hooks, 'useCreateOrganizationWithRelationships').mockImplementation(() => ({
      mutateAsync: async (...args) => {
        // Before the mutation happens, simulate user becoming unauthenticated
        authHookSpy.mockImplementation(() => ({
          user: null,
          loading: false,
          authenticated: false,
          isAuthenticated: false // Add this to match the actual hook
        }));
        // Continue with a delayed response to give time for state to update
        await new Promise(resolve => setTimeout(resolve, 10));
        return null; // Return null as we expect the submission to fail
      },
      isPending: false,
      isError: false,
      isSuccess: false
    } as any));
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Organization Name\*/i), {
      target: { value: 'Test Organization' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Organization/i }));
    
    // Wait for the auth state change to be processed
    await waitFor(() => {
      // Verify the mutation doesn't complete successfully (no navigation)
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
    
    // Verify the component is now showing the redirect to auth
    await waitFor(() => {
      expect(screen.getByTestId('mock-navigate')).toBeInTheDocument();
      expect(screen.getByText(/Redirected to \/auth with state:/)).toBeInTheDocument();
    });
  });
});
