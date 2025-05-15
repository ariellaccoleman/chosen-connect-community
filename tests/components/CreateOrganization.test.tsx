
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CreateOrganization from '@/pages/CreateOrganization';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as hooks from '@/hooks/useOrganizationMutations';
import { BrowserRouter } from 'react-router-dom';
import * as AuthHook from '@/hooks/useAuth';

// Mock react-router-dom
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate
}));

// Mock the hooks
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('@/hooks/useOrganizationMutations', () => ({
  useCreateOrganization: jest.fn()
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
    
    // Mock useAuth hook
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: mockUser,
      loading: false,
      authenticated: true
    }));
    
    // Mock useCreateOrganization hook
    jest.spyOn(hooks, 'useCreateOrganization').mockImplementation(() => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      isSuccess: false
    } as any));
  });

  test('renders the create organization form correctly', () => {
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Check for form elements
    expect(screen.getByText('Create New Organization')).toBeInTheDocument();
    expect(screen.getByLabelText(/Organization Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Website URL/i)).toBeInTheDocument();
    expect(screen.getByText('Create Organization')).toBeInTheDocument();
  });

  test('handles form submission correctly', async () => {
    // Mock successful mutation response
    mockMutateAsync.mockResolvedValueOnce('new-org-id');
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Organization Name/i), {
      target: { value: 'Test Organization' }
    });
    
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'This is a test organization' }
    });
    
    fireEvent.change(screen.getByLabelText(/Website URL/i), {
      target: { value: 'https://test.org' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Organization'));
    
    // Verify mutation was called with correct data
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        data: {
          name: 'Test Organization',
          description: 'This is a test organization',
          website_url: 'https://test.org',
        },
        userId: 'user-123'
      });
    });
    
    // Verify navigation happened
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/organizations/new-org-id');
    });
  });

  test('validates form inputs', async () => {
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Submit form without required fields
    fireEvent.click(screen.getByText('Create Organization'));
    
    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByText(/Organization name must be at least 2 characters/i)).toBeInTheDocument();
    });
    
    // Enter invalid URL
    fireEvent.change(screen.getByLabelText(/Organization Name/i), {
      target: { value: 'Test Organization' }
    });
    
    fireEvent.change(screen.getByLabelText(/Website URL/i), {
      target: { value: 'not-a-url' }
    });
    
    // Submit form again
    fireEvent.click(screen.getByText('Create Organization'));
    
    // Check for URL validation message
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid URL/i)).toBeInTheDocument();
    });
    
    // Verify mutation was not called
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  test('shows loading state during submission', async () => {
    // Mock pending mutation state
    jest.spyOn(hooks, 'useCreateOrganization').mockImplementation(() => ({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
      isSuccess: false
    } as any));
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Check for loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    // Use a more specific query to target the submit button
    expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
  });

  test('handles case when user is not authenticated', async () => {
    // Mock unauthenticated state - ensure component renders even when unauthenticated
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: null,
      loading: false,
      authenticated: false
    }));
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Verify the component renders
    expect(screen.getByText('Create New Organization')).toBeInTheDocument();
    
    // Fill form (using getByRole instead of getByLabelText since we've verified the component renders)
    fireEvent.change(screen.getByRole('textbox', { name: /Organization Name/i }), {
      target: { value: 'Test Organization' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Organization/i }));
    
    // Verify mutation was not called due to missing user
    await waitFor(() => {
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });
});
