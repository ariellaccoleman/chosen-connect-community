
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CreateEvent from '@/pages/CreateEvent';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
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

describe('CreateEvent Component', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('redirects unauthenticated users to auth page with correct state', () => {
    // Mock unauthenticated state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: null,
      loading: false,
      authenticated: false
    }));
    
    render(<CreateEvent />, { wrapper: Wrapper });
    
    // Check for redirect with correct 'from' state
    expect(screen.getByTestId('mock-navigate')).toBeInTheDocument();
    expect(screen.getByText(/Redirected to \/auth with state:/)).toBeInTheDocument();
    expect(screen.getByText(/events\/new/)).toBeInTheDocument();
  });
  
  test('shows loading skeleton while checking authentication', () => {
    // Mock loading state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: null,
      loading: true,
      authenticated: false
    }));
    
    render(<CreateEvent />, { wrapper: Wrapper });
    
    // Verify skeleton components are shown during loading
    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThan(0);
  });
  
  test('renders the event form for authenticated users', () => {
    // Mock authenticated state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: mockUser,
      loading: false,
      authenticated: true
    }));
    
    // Mock the EventForm component
    jest.mock('@/components/events/EventForm', () => ({
      __esModule: true,
      default: () => <div data-testid="event-form">Event Form</div>
    }));
    
    render(<CreateEvent />, { wrapper: Wrapper });
    
    // The component should be wrapped in an ErrorBoundary, but the content should be visible
    expect(screen.getByText(/container/i)).toBeInTheDocument();
  });
});
