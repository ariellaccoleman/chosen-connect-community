
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateOrganization from '@/pages/CreateOrganization';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import * as AuthHook from '@/hooks/useAuth';
import * as hooks from '@/hooks/organizations';

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
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/organizations');

// Create QueryClient for tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Create a wrapper for the component with necessary providers
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </BrowserRouter>
);

describe('CreateOrganization Component', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockCreateOrganization = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth state: authenticated
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: mockUser,
      loading: false,
      isAuthenticated: true
    }));
    
    // Default organization creation mock
    jest.spyOn(hooks, 'useCreateOrganizationWithRelationships').mockImplementation(() => ({
      mutateAsync: mockCreateOrganization,
      isPending: false
    } as any));
  });
  
  test('redirects unauthenticated users to auth page', () => {
    // Mock unauthenticated state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: null,
      loading: false,
      isAuthenticated: false
    }));
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Check for redirect with correct 'from' state
    expect(screen.getByTestId('mock-navigate')).toBeInTheDocument();
    expect(screen.getByText(/Redirected to \/auth with state:/)).toBeInTheDocument();
    expect(screen.getByText(/organizations\/new/)).toBeInTheDocument();
  });
  
  test('shows loading skeleton while checking authentication', () => {
    // Mock loading state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: null,
      loading: true,
      isAuthenticated: false
    }));
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Verify skeleton components are shown during loading
    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThan(0);
  });
  
  test('renders the form for authenticated users', () => {
    // Mock authenticated state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: mockUser,
      loading: false,
      isAuthenticated: true
    }));
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Check for the heading and form elements
    expect(screen.getByText('Create New Organization')).toBeInTheDocument();
    expect(screen.getByLabelText(/Organization Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Website URL/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Organization/i })).toBeInTheDocument();
  });
  
  test('submits the form correctly', async () => {
    // Mock successful organization creation
    mockCreateOrganization.mockResolvedValue('new-org-id');
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Organization Name/), { 
      target: { value: 'Test Organization' } 
    });
    
    fireEvent.change(screen.getByLabelText(/Description/), { 
      target: { value: 'Test Description' } 
    });
    
    fireEvent.change(screen.getByLabelText(/Website URL/), { 
      target: { value: 'https://example.com' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Organization/i }));
    
    // Check that the mutation was called with correct data
    await waitFor(() => {
      expect(mockCreateOrganization).toHaveBeenCalledWith({
        name: 'Test Organization',
        description: 'Test Description',
        website_url: 'https://example.com',
        userId: 'user-123'
      });
    });
    
    // Check that navigation happened
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/organizations/new-org-id');
    });
  });
  
  test('shows loading state during submission', () => {
    // Mock pending submission
    jest.spyOn(hooks, 'useCreateOrganizationWithRelationships').mockImplementation(() => ({
      mutateAsync: mockCreateOrganization,
      isPending: true
    } as any));
    
    render(<CreateOrganization />, { wrapper: Wrapper });
    
    // Check that the button is disabled and shows loading text
    const submitButton = screen.getByRole('button', { name: /Creating/i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Creating...');
  });
});
